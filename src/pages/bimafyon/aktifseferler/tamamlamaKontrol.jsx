import { REQUIRED_FIELDS } from "./constants";
import { getColumnLabel } from "./helpers";

export function validateRow(row) {
    return REQUIRED_FIELDS.filter((field) => String(row[field] ?? "").trim() === "");
}

export function validateRowDetailed(row) {
    return validateRow(row).map((field) => ({
        field,
        label: getColumnLabel(field),
    }));
}

export function isTripReadyToComplete(row) {
    return validateRow(row).length === 0;
}