export async function eksikAracKaydet({
    vehicle,
    kayipAracEkle,
    setMissingVehicles,
    fetchAraclar,
}) {
    const saved = await kayipAracEkle(vehicle);
    if (!saved) return;

    setMissingVehicles((prev) =>
        prev.filter((item) => item.cekici !== vehicle.cekici)
    );

    await fetchAraclar();
}