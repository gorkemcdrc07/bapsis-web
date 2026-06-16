import { REQUIRED_FIELDS } from "./constants";

export function validateRow(row) {
    return REQUIRED_FIELDS.filter((field) => String(row[field] ?? "").trim() === "");
}

export function isTripReadyToComplete(row) {
    return validateRow(row).length === 0;
}