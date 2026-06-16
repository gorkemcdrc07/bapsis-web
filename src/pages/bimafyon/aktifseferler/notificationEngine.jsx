const sentAlerts = new Map();

export function triggerFleetAlert(row) {
    const id = row.id;

    const isAlarm =
        row.freshlianceAlarm || row.freshlianceOffline;

    if (!isAlarm) return;

    const lastSent = sentAlerts.get(id);
    const now = Date.now();

    // spam engelle (30 sn cooldown)
    if (lastSent && now - lastSent < 30000) return;

    sentAlerts.set(id, now);

    let message = "";

    if (row.freshlianceOffline) {
        message = `⚫ OFFLINE: ${row.custom_name || row.cekici}`;
    } else if (row.freshlianceAlarm) {
        message = `🔴 TEMP ALERT: ${row.custom_name || row.cekici} - ${row.freshlianceTemperature}`;
    }

    console.log(message);

    // browser notification
    if (Notification.permission === "granted") {
        new Notification("FLEET ALERT", {
            body: message,
        });
    }

    // optional: console alarm
    console.warn("FLEET ALERT:", message);
}