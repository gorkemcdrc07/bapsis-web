export function sutunGorunurlukDegistir(key, setHiddenColumns) {
    setHiddenColumns((prev) =>
        prev.includes(key)
            ? prev.filter((item) => item !== key)
            : [...prev, key]
    );
}