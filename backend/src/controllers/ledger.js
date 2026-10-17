import { asyncHandler } from "../utils/asyncHandler.js";
import { toCSV } from "@collabsphere/shared";
import { auditLedger, ledgerCsvRows, listLedger } from "../services/ledger.js";

export const list = asyncHandler((_req, res) => {
  res.json(listLedger());
});

export const audit = asyncHandler((_req, res) => {
  res.json(auditLedger());
});

export const exportCsv = asyncHandler((_req, res) => {
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", 'attachment; filename="collabsphere-ledger.csv"');
  res.send(toCSV(ledgerCsvRows()));
});
