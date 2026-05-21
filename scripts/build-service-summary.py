import datetime as dt
import json
import math
import pathlib
import re
import statistics
import zipfile
import xml.etree.ElementTree as ET
from collections import Counter, defaultdict

ROOT = pathlib.Path(__file__).resolve().parents[1]
SOURCE = ROOT / "data" / "vin_share_Desafio_02.xlsx"
TARGET = ROOT / "api" / "data" / "vin-share-summary.json"
NS = "{http://schemas.openxmlformats.org/spreadsheetml/2006/main}"


def column_index(cell_ref: str) -> int:
    letters = "".join(ch for ch in cell_ref if ch.isalpha())
    value = 0
    for letter in letters:
        value = value * 26 + ord(letter.upper()) - 64
    return value - 1


def parse_date(value: str | None) -> dt.date | None:
    if not value:
        return None
    value = str(value).strip()
    for fmt in ("%m/%d/%Y", "%d/%m/%Y", "%Y-%m-%d"):
        try:
            return dt.datetime.strptime(value, fmt).date()
        except ValueError:
            continue
    return None


def parse_int(value: str | None) -> int | None:
    if value is None or str(value).strip() == "":
        return None
    try:
        return int(float(str(value).replace(",", ".")))
    except ValueError:
        return None


def pct(numerator: float, denominator: float) -> float:
    return round((numerator / denominator) * 100, 1) if denominator else 0


def iso(value: dt.date | None) -> str | None:
    return value.isoformat() if value else None


def month_key(value: dt.date) -> str:
    return f"{value.year:04d}-{value.month:02d}"


def load_shared_strings(book: zipfile.ZipFile) -> list[str]:
    root = ET.fromstring(book.read("xl/sharedStrings.xml"))
    strings: list[str] = []
    for item in root.findall(NS + "si"):
        strings.append("".join((text.text or "") for text in item.iter(NS + "t")))
    return strings


def iter_sheet_rows(book: zipfile.ZipFile, shared_strings: list[str]):
    with book.open("xl/worksheets/sheet1.xml") as sheet:
        for _, elem in ET.iterparse(sheet, events=("end",)):
            if elem.tag != NS + "row":
                continue

            values: list[str] = []
            for cell in elem.findall(NS + "c"):
                idx = column_index(cell.attrib.get("r", "A1"))
                while len(values) <= idx:
                    values.append("")

                raw = cell.find(NS + "v")
                value = raw.text if raw is not None else ""
                if cell.attrib.get("t") == "s" and value != "":
                    value = shared_strings[int(value)]
                values[idx] = value

            elem.clear()
            yield values


def default_vin_state(vin_hash: str) -> dict:
    return {
        "vin": vin_hash,
        "serviceCount": 0,
        "agendaCount": 0,
        "firstService": None,
        "previousService": None,
        "lastService": None,
        "lastDealer": None,
        "lastModel": None,
        "lastModelYear": None,
        "lastKm": None,
        "country": None,
        "purchaseDate": None,
        "warrantyStart": None,
        "maintenanceNumber": None,
    }


def update_vin_state(state: dict, row: dict, service_date: dt.date | None) -> None:
    state["serviceCount"] += 1
    if row["IsAgendaSchedule"] == "1" or "Agenda" in row["MainSource"]:
        state["agendaCount"] += 1

    purchase_date = (
        parse_date(row["DeliveryDate"])
        or parse_date(row["SalesDate"])
        or parse_date(row["RegistrationDate"])
        or parse_date(row["InvoiceDate"])
    )
    warranty_start = parse_date(row["WarrantyStartDate"])

    if purchase_date and (state["purchaseDate"] is None or purchase_date < state["purchaseDate"]):
        state["purchaseDate"] = purchase_date
    if warranty_start and (state["warrantyStart"] is None or warranty_start < state["warrantyStart"]):
        state["warrantyStart"] = warranty_start

    if service_date and (state["firstService"] is None or service_date < state["firstService"]):
        state["firstService"] = service_date

    if service_date and (state["lastService"] is None or service_date >= state["lastService"]):
        if state["lastService"] is not None and service_date != state["lastService"]:
            state["previousService"] = state["lastService"]
        state["lastService"] = service_date
        state["lastDealer"] = row["DealerCode"]
        state["lastModel"] = row["ModelName"] or "Sem modelo"
        state["lastModelYear"] = parse_int(row["ModelYear"])
        state["lastKm"] = parse_int(row["KM"])
        state["country"] = row["Country"]
        state["maintenanceNumber"] = parse_int(row["MaintenanceNumber"])


def add_counter_item(counter: Counter, total: int, limit: int = 8) -> list[dict]:
    return [
        {"label": str(label) if label != "" else "Nao informado", "count": count, "share": pct(count, total)}
        for label, count in counter.most_common(limit)
    ]


def trend_delta(current: int, previous: int) -> float:
    return round(((current - previous) / previous) * 100, 1) if previous else 0


def main() -> None:
    if not SOURCE.exists():
        raise SystemExit(f"Planilha nao encontrada: {SOURCE}")

    total_orders = 0
    agenda_orders = 0
    cycle_days: list[int] = []
    countries = Counter()
    service_sources = Counter()
    maintenance_numbers = Counter()
    status_counter = Counter()

    monthly_orders = Counter()
    monthly_vins: dict[str, set[str]] = defaultdict(set)
    dealer_stats = defaultdict(lambda: {
        "orders": 0,
        "agenda": 0,
        "vins": set(),
        "last12Vins": set(),
        "kmSum": 0,
        "kmCount": 0,
        "models": Counter(),
        "latestService": None,
    })
    model_stats = defaultdict(lambda: {
        "orders": 0,
        "vins": set(),
        "last12Vins": set(),
        "kmSum": 0,
        "kmCount": 0,
        "dealers": set(),
        "latestService": None,
    })
    vin_states: dict[str, dict] = {}
    all_vins: set[str] = set()
    analysis_date: dt.date | None = None
    min_service_date: dt.date | None = None

    with zipfile.ZipFile(SOURCE) as book:
        shared_strings = load_shared_strings(book)
        rows = iter_sheet_rows(book, shared_strings)
        headers = next(rows)

        for values in rows:
            row = dict(zip(headers, values))
            total_orders += 1

            service_date = parse_date(row.get("ServiceDate"))
            opened = parse_date(row.get("ServiceOpenDate"))
            closed = parse_date(row.get("ServiceClosedDate"))
            dealer = row.get("DealerCode") or "Nao informado"
            model = row.get("ModelName") or "Sem modelo"
            vin = row.get("VIN_Hash") or ""
            source = row.get("MainSource") or "Nao informado"
            country = row.get("Country") or "Nao informado"
            km = parse_int(row.get("KM"))

            if service_date:
                analysis_date = service_date if analysis_date is None else max(analysis_date, service_date)
                min_service_date = service_date if min_service_date is None else min(min_service_date, service_date)
                key = month_key(service_date)
                monthly_orders[key] += 1
                if vin:
                    monthly_vins[key].add(vin)

            if opened and closed and closed >= opened:
                cycle_days.append((closed - opened).days)

            if vin:
                all_vins.add(vin)
                state = vin_states.setdefault(vin, default_vin_state(vin))
                update_vin_state(state, row, service_date)

            if row.get("IsAgendaSchedule") == "1" or "Agenda" in source:
                agenda_orders += 1

            countries[country] += 1
            service_sources[source] += 1
            maintenance_numbers[row.get("MaintenanceNumber") or "Nao informado"] += 1
            status_counter[row.get("StatusUSA") or "Nao informado"] += 1

            dealer_bucket = dealer_stats[dealer]
            dealer_bucket["orders"] += 1
            dealer_bucket["agenda"] += 1 if row.get("IsAgendaSchedule") == "1" or "Agenda" in source else 0
            dealer_bucket["vins"].add(vin)
            dealer_bucket["models"][model] += 1
            if km is not None:
                dealer_bucket["kmSum"] += km
                dealer_bucket["kmCount"] += 1
            if service_date and (dealer_bucket["latestService"] is None or service_date > dealer_bucket["latestService"]):
                dealer_bucket["latestService"] = service_date

            model_bucket = model_stats[model]
            model_bucket["orders"] += 1
            model_bucket["vins"].add(vin)
            model_bucket["dealers"].add(dealer)
            if km is not None:
                model_bucket["kmSum"] += km
                model_bucket["kmCount"] += 1
            if service_date and (model_bucket["latestService"] is None or service_date > model_bucket["latestService"]):
                model_bucket["latestService"] = service_date

    if analysis_date is None:
        raise SystemExit("Nao foi possivel identificar datas de servico.")

    last12_start = analysis_date - dt.timedelta(days=365)
    active_last12_vins = {
        vin for vin, state in vin_states.items()
        if state["lastService"] and state["lastService"] >= last12_start
    }

    for vin, state in vin_states.items():
        last_service = state["lastService"]
        dealer = state["lastDealer"]
        model = state["lastModel"]
        if last_service and last_service >= last12_start:
            if dealer in dealer_stats:
                dealer_stats[dealer]["last12Vins"].add(vin)
            if model in model_stats:
                model_stats[model]["last12Vins"].add(vin)

    sorted_months = sorted(monthly_orders)
    monthly = [
        {"month": key, "orders": monthly_orders[key], "uniqueVins": len(monthly_vins[key])}
        for key in sorted_months[-24:]
    ]
    last3 = sorted_months[-3:]
    previous3 = sorted_months[-6:-3]
    last3_orders = sum(monthly_orders[key] for key in last3)
    previous3_orders = sum(monthly_orders[key] for key in previous3)

    lead_items = []
    lead_funnel = Counter()
    segment_counts = Counter()
    model_risk = Counter()
    dealer_risk = Counter()

    for vin, state in vin_states.items():
        last_service = state["lastService"]
        if last_service is None:
            continue

        days_since = (analysis_date - last_service).days
        service_count = state["serviceCount"]
        had_agenda = state["agendaCount"] > 0
        first_service = state["firstService"]
        avg_interval = None
        if first_service and service_count > 1 and last_service > first_service:
            avg_interval = max(45, round((last_service - first_service).days / (service_count - 1)))

        purchase_date = state["purchaseDate"]
        warranty_start = state["warrantyStart"]
        warranty_end = warranty_start + dt.timedelta(days=365 * 3) if warranty_start else None
        days_to_warranty_end = (warranty_end - analysis_date).days if warranty_end else None
        km_per_year = None
        if purchase_date and state["lastKm"] is not None and last_service > purchase_date:
            years = max((last_service - purchase_date).days / 365, 0.25)
            km_per_year = round(state["lastKm"] / years)

        if days_since <= 365 and service_count >= 3:
            segment_counts["Clientes fieis"] += 1
        elif days_since > 365:
            segment_counts["Risco de evasao"] += 1
        elif service_count <= 1:
            segment_counts["Primeira manutencao"] += 1
        elif not had_agenda:
            segment_counts["Oportunidade digital"] += 1
        else:
            segment_counts["Relacionamento ativo"] += 1

        score = 0
        reasons = []
        if days_since >= 420:
            score += 45
            reasons.append(f"{days_since} dias sem servico")
        elif days_since >= 330:
            score += 32
            reasons.append("janela anual de revisao")
        elif days_since >= 240:
            score += 18
            reasons.append("aproximando revisao")

        if service_count <= 1:
            score += 16
            reasons.append("baixo historico na rede")
        elif service_count == 2:
            score += 8

        if not had_agenda:
            score += 10
            reasons.append("sem agendamento digital")

        if km_per_year and km_per_year >= 18000:
            score += 12
            reasons.append("rodagem alta")
        elif km_per_year and km_per_year >= 12000:
            score += 6

        if days_to_warranty_end is not None:
            if -180 <= days_to_warranty_end <= 120:
                score += 10
                reasons.append("garantia em fase critica")
            elif days_to_warranty_end < -180:
                score += 4

        score = min(100, score)
        if score >= 70:
            priority = "Alta"
        elif score >= 45:
            priority = "Media"
        else:
            priority = "Baixa"
        lead_funnel[priority] += 1

        if score >= 45:
            next_due_days = avg_interval if avg_interval else 365
            next_due = last_service + dt.timedelta(days=next_due_days)
            action = "Contato consultivo com oferta de revisao"
            if not had_agenda:
                action = "Enviar link de agendamento e lembrete personalizado"
            if days_to_warranty_end is not None and -180 <= days_to_warranty_end <= 120:
                action = "Check-up de garantia e pacote de manutencao"
            if days_since >= 420:
                action = "Acionamento prioritario da concessionaria"

            lead = {
                "id": vin[:12].upper(),
                "vinMask": f"{vin[:6].upper()}...{vin[-4:].upper()}",
                "dealerCode": state["lastDealer"] or "Nao informado",
                "modelName": state["lastModel"] or "Sem modelo",
                "modelYear": state["lastModelYear"],
                "lastServiceDate": iso(last_service),
                "daysSinceService": days_since,
                "serviceCount": service_count,
                "lastKm": state["lastKm"],
                "estimatedKmPerYear": km_per_year,
                "nextDueDate": iso(next_due),
                "warrantyEndDate": iso(warranty_end),
                "priority": priority,
                "score": score,
                "reason": ", ".join(reasons[:3]) if reasons else "potencial de relacionamento",
                "recommendedAction": action,
            }
            lead_items.append(lead)
            model_risk[lead["modelName"]] += 1
            dealer_risk[lead["dealerCode"]] += 1

    lead_items.sort(key=lambda item: (item["score"], item["daysSinceService"]), reverse=True)
    sampled_leads = []
    for priority in ("Alta", "Media"):
        sampled_leads.extend([item for item in lead_items if item["priority"] == priority][:80])
    lead_items = sampled_leads

    qualified_lead_count = lead_funnel["Alta"] + lead_funnel["Media"]

    dealers = []
    for code, bucket in dealer_stats.items():
        vin_count = len(bucket["vins"])
        last12_count = len(bucket["last12Vins"])
        avg_km = round(bucket["kmSum"] / bucket["kmCount"]) if bucket["kmCount"] else None
        top_model, top_model_count = bucket["models"].most_common(1)[0]
        dealers.append({
            "dealerCode": code,
            "orders": bucket["orders"],
            "uniqueVins": vin_count,
            "activeLast12": last12_count,
            "serviceShare": pct(last12_count, vin_count),
            "agendaRate": pct(bucket["agenda"], bucket["orders"]),
            "avgKm": avg_km,
            "topModel": top_model,
            "topModelShare": pct(top_model_count, bucket["orders"]),
            "latestServiceDate": iso(bucket["latestService"]),
            "openLeads": dealer_risk[code],
        })
    dealers.sort(key=lambda item: item["orders"], reverse=True)

    models = []
    for name, bucket in model_stats.items():
        vin_count = len(bucket["vins"])
        last12_count = len(bucket["last12Vins"])
        avg_km = round(bucket["kmSum"] / bucket["kmCount"]) if bucket["kmCount"] else None
        models.append({
            "modelName": name,
            "orders": bucket["orders"],
            "uniqueVins": vin_count,
            "activeLast12": last12_count,
            "serviceShare": pct(last12_count, vin_count),
            "avgKm": avg_km,
            "dealerCount": len(bucket["dealers"]),
            "latestServiceDate": iso(bucket["latestService"]),
            "riskLeads": model_risk[name],
        })
    models.sort(key=lambda item: item["orders"], reverse=True)

    service_share = pct(len(active_last12_vins), len(all_vins))
    avg_cycle = round(statistics.mean(cycle_days), 1) if cycle_days else 0
    median_cycle = round(statistics.median(cycle_days), 1) if cycle_days else 0

    low_share_dealers = [
        dealer for dealer in sorted(
            (item for item in dealers if item["uniqueVins"] >= 250),
            key=lambda item: item["serviceShare"]
        )[:8]
    ]
    risk_models = [
        {"label": label, "count": count, "share": pct(count, max(1, sum(model_risk.values())))}
        for label, count in model_risk.most_common(8)
    ]

    summary = {
        "meta": {
            "source": SOURCE.name,
            "generatedAt": dt.datetime.now().isoformat(timespec="seconds"),
            "analysisDate": iso(analysis_date),
            "dateRange": {"start": iso(min_service_date), "end": iso(analysis_date)},
            "methodology": "Service Share estimado = VINs unicos com servico pago nos ultimos 12 meses / VINs unicos observados na base.",
        },
        "overview": {
            "serviceShare": service_share,
            "activeLast12Vins": len(active_last12_vins),
            "eligibleVins": len(all_vins),
            "serviceOrders": total_orders,
            "agendaRate": pct(agenda_orders, total_orders),
            "avgServicesPerVin": round(total_orders / len(all_vins), 2) if all_vins else 0,
            "avgCycleDays": avg_cycle,
            "medianCycleDays": median_cycle,
            "quarterOrderDelta": trend_delta(last3_orders, previous3_orders),
            "leadCount": qualified_lead_count,
            "highPriorityLeads": lead_funnel["Alta"],
        },
        "breakdowns": {
            "countries": add_counter_item(countries, total_orders),
            "serviceSources": add_counter_item(service_sources, total_orders),
            "maintenanceNumbers": add_counter_item(maintenance_numbers, total_orders, 10),
            "statuses": add_counter_item(status_counter, total_orders),
            "segments": [
                {"label": label, "count": count, "share": pct(count, len(all_vins))}
                for label, count in segment_counts.most_common()
            ],
            "leadFunnel": [
                {"label": label, "count": lead_funnel[label], "share": pct(lead_funnel[label], len(all_vins))}
                for label in ("Alta", "Media", "Baixa")
            ],
            "riskModels": risk_models,
        },
        "monthly": monthly,
        "dealers": dealers[:80],
        "models": models[:30],
        "leads": lead_items,
        "insights": [
            {
                "title": "Service Share estimado",
                "value": f"{service_share}%",
                "description": f"{len(active_last12_vins):,} VINs voltaram para servico pago nos ultimos 12 meses.".replace(",", "."),
            },
            {
                "title": "Tendencia de oficina",
                "value": f"{trend_delta(last3_orders, previous3_orders)}%",
                "description": "Comparacao do volume dos 3 meses mais recentes contra os 3 meses anteriores.",
            },
            {
                "title": "Concessionarias com oportunidade",
                "value": str(len(low_share_dealers)),
                "description": "Lojas com base relevante e menor retorno recente para priorizar plano de acao.",
            },
        ],
        "opportunities": {
            "lowShareDealers": low_share_dealers,
            "playbook": [
                {
                    "segment": "Risco de evasao",
                    "trigger": "Mais de 365 dias sem servico",
                    "action": "Contato ativo da concessionaria com cupom de revisao e opcao de retirada/entrega.",
                    "metric": "Conversao de lead em ordem de servico em 30 dias",
                },
                {
                    "segment": "Primeira manutencao",
                    "trigger": "Apenas uma passagem na rede",
                    "action": "Sequencia de lembretes para segunda revisao com preco fechado e agenda rapida.",
                    "metric": "Taxa de retorno para segunda manutencao",
                },
                {
                    "segment": "Oportunidade digital",
                    "trigger": "Historico sem agenda digital",
                    "action": "Oferta de agendamento pelo app e confirmacao por canal preferido.",
                    "metric": "Aumento do agenda rate",
                },
                {
                    "segment": "Rodagem alta",
                    "trigger": "Estimativa acima de 18 mil km/ano",
                    "action": "Plano preventivo por km, pneus, freios e revisao de seguranca.",
                    "metric": "Ticket medio e recorrencia por VIN",
                },
            ],
        },
    }

    TARGET.parent.mkdir(parents=True, exist_ok=True)
    TARGET.write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Resumo gerado em {TARGET}")
    print(f"{total_orders} ordens, {len(all_vins)} VINs, Service Share {service_share}%")


if __name__ == "__main__":
    main()
