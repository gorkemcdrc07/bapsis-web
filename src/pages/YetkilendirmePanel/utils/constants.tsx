import type {
    PanelTab,
    RolMeta,
    SayfaDef,
    UserFormState,
} from "../types";

export const ROLES: RolMeta[] = [
    { key: "admin", label: "Admin", color: "#111827", bg: "#f8fafc", border: "#d1d5db", icon: "ti-shield-lock", desc: "" },
    { key: "mudur", label: "Müdür", color: "#111827", bg: "#f8fafc", border: "#d1d5db", icon: "ti-briefcase", desc: "" },
    { key: "yonetici", label: "Yönetici", color: "#111827", bg: "#f8fafc", border: "#d1d5db", icon: "ti-user-check", desc: "" },
    { key: "kullanici", label: "Kullanıcı", color: "#111827", bg: "#f8fafc", border: "#d1d5db", icon: "ti-user", desc: "" },
];

export const PAGES: SayfaDef[] = [
    {
        key: "anasayfa",
        label: "Anasayfa",
        path: "/anasayfa",
        grup: "Genel",
        columns: ["Dashboard Kartları", "Toplam Sipariş", "Aktif Araçlar", "Tamamlanan Sefer"],
        buttons: ["Yeni Sipariş", "Planlama", "Manuel Sipariş", "Araçlar"],
    },
    {
        key: "bim_planlama",
        label: "Planlama",
        path: "/bimafyon/planlama",
        grup: "BİM AFYON",
        columns: [
            "Sefer No", "Sevk Tarihi", "Yükleyen Depo", "Kalkış Yeri", "Araç Cinsi",
            "Çekici", "Dorse", "Sürücü", "Telefon", "Varış 1", "Varış 2", "Varış 3",
            "Varış 4", "Palet", "Navlun", "Rota", "Durak Sayısı", "Doluluk %",
        ],
        buttons: [
            "Veri Dosyası Yükle", "Talep Dosyası Yükle", "Planlamayı Çalıştır",
            "Araç Ekle", "Aracı Sil", "+ Durak", "Durak Sil", "Başka Araca Taşı",
            "Başka Sefere Al", "Araca Geri Al", "Araç Maliyeti Düzenle",
            "Özeti Göster/Gizle", "JSON İndir", "Aktif Sefere Aktar",
        ],
    },
    {
        key: "bim_manuel",
        label: "Manuel Sipariş",
        path: "/bimafyon/manuelsiparis",
        grup: "BİM AFYON",
        columns: [
            "Sevk Tarihi", "Müşteri / Firma", "Varış 1", "Varış 2", "Varış 3",
            "Varış 4", "Palet", "Araç Cinsi", "Açıklama", "Kaynak",
        ],
        buttons: [
            "Excel Verisi Aktar", "Siparişi Listeye Ekle", "Sipariş Sil",
            "Listeyi Temizle", "Plaka Atamaya Geç",
        ],
    },
    {
        key: "bim_aktif",
        label: "Aktif Seferler",
        path: "/bimafyon/aktifseferler",
        grup: "BİM AFYON",
        columns: [
            "ID", "Sefer No", "Sevk Tarihi", "Yükleyen Depo", "Kalkış Yeri",
            "Araç Cinsi", "Çekici", "Dorse", "TC", "Sürücü", "Telefon", "VKN",
            "Varış 1", "Varış 2", "Varış 3", "Varış 4", "Palet", "İrsaliye",
            "Dataloger No", "Batarya", "Konum", "Son Veri", "Sıcaklık", "Navlun",
            "Araç Durumu", "Peron No",
        ],
        buttons: [
            "Excel İçe Aktar", "Excel Aktar", "İrsaliye Okut", "Sütun Ayarları",
            "Görünüm Kaydet", "Araç Seç", "Şoför Değiştir", "Sefer Sil",
            "Sefer Tamamla", "Toplu Sefer Tamamla", "Navlun Eşleştir",
            "Haritada Göster",
        ],
    },
    {
        key: "bim_silinen",
        label: "Silinen Seferler",
        path: "/bimafyon/silinenseferler",
        grup: "BİM AFYON",
        columns: [
            "Eski ID", "Sefer No", "Çekici", "Sürücü", "Varış", "Durum",
            "Silinme Nedeni", "Silen Kullanıcı", "Tarih",
        ],
        buttons: ["Yenile", "Detay Aç"],
    },
    {
        key: "bim_tamamlanan",
        label: "Tamamlanan",
        path: "/bimafyon/tamamlananseferler",
        grup: "BİM AFYON",
        columns: [
            "Eski ID", "Sefer No", "Çekici", "Dorse", "Sürücü", "Telefon",
            "Varış", "İrsaliye", "Tamamlayan", "Tarih",
        ],
        buttons: ["Yenile", "Detay Aç"],
    },
    {
        key: "araclar",
        label: "Araç Yönetimi",
        path: "/aracyonetimi/araclar",
        grup: "Araç Yönetimi",
        columns: ["Sürücü", "Çekici Plaka", "Dorse Plaka", "TC", "Telefon", "VKN", "Dataloger No"],
        buttons: ["Yeni Araç", "Düzenle", "Sil", "Excel Aktar", "Kart/Tablo Görünümü"],
    },
    {
        key: "donus_siparis",
        label: "Sipariş",
        path: "/donusler/siparis",
        grup: "Dönüşler",
        columns: ["Müşteri", "Yükleme Yeri", "Teslim Yeri", "Navlun", "Sevk Tarihi"],
        buttons: [
            "Yeni Değer Ekle", "Müşteri Seç", "Rota Seç",
            "Siparişi Önizlemeye Ekle", "Siparişleri Aç", "Yenile",
        ],
    },
    {
        key: "donus_plaka",
        label: "Plaka Atama",
        path: "/donusler/plakaatama",
        grup: "Dönüşler",
        columns: [
            "Sefer No", "Sevk Tarihi", "Yükleyen Depo", "Kalkış Yeri", "Çekici",
            "Dorse", "TC", "Sürücü", "Telefon", "VKN", "Varış 1", "Varış 2",
            "Varış 3", "Varış 4", "Palet", "İrsaliye", "Dataloger No", "Navlun",
            "Araç Durumu", "Peron No",
        ],
        buttons: [
            "Excel İçe Aktar", "Excel Aktar", "İrsaliye Okut", "Araç Seç",
            "Şoför Değiştir", "Sefer Sil", "Sefer Tamamla", "Haritada Göster",
        ],
    },
    {
        key: "donus_tamamlanan",
        label: "Tamamlanan",
        path: "/donusler/tamamlananseferler",
        grup: "Dönüşler",
        columns: [
            "Tamamlanma Tarihi", "Sefer No", "Sevk Tarihi", "Çekici", "Dorse",
            "Sürücü", "Telefon", "İrsaliye", "Navlun", "Tamamlayan",
        ],
        buttons: ["Yenile"],
    },
    {
        key: "donus_navlun",
        label: "Navlunlar",
        path: "/donusler/navlunlar",
        grup: "Dönüşler",
        columns: ["Müşteri Adı", "Yükleme Yeri", "Teslim Yeri", "Navlun"],
        buttons: ["Yeni Navlun Ekle", "Düzenle", "Güncelle", "Sil"],
    },
    {
        key: "ekkayit_vkn",
        label: "VKN",
        path: "/ekkayitlar/vkn",
        grup: "Ek Kayıtlar",
        columns: ["VKN", "Kullanım Sayısı"],
        buttons: ["Yeni VKN Ekle", "Düzenle", "Güncelle", "Sil"],
    },
    {
        key: "ekkayit_ugrama",
        label: "Uğrama",
        path: "/ekkayitlar/ugrama",
        grup: "Ek Kayıtlar",
        columns: ["VKN", "Müşteri / Tip", "Tutar", "Durum"],
        buttons: ["İkiz Depo Şartını Aç/Kapat", "Tutar Güncelle", "Durum Değiştir"],
    },
    {
        key: "ekkayit_navlun",
        label: "Navlun",
        path: "/ekkayitlar/navlun",
        grup: "Ek Kayıtlar",
        columns: ["ID", "Varış 1", "Varış 2", "Varış 3", "Fiyat", "Durum", "Kayıt"],
        buttons: ["Satırı Düzenle", "Kaydet", "Vazgeç", "Durum Değiştir", "Fiyat Güncelle"],
    },
];

export const EMPTY_USER_FORM: UserFormState = {
    id: "",
    name: "",
    email: "",
    password: "",
    dept: "",
    role: "kullanici",
    aktif: true,
};

export const TABS: { key: PanelTab; label: string; icon: string; desc: string }[] = [
    { key: "kullanicilar", label: "Kullanıcılar", icon: "ti-users", desc: "" },
    { key: "yetkilendirme", label: "Yetkilendirme", icon: "ti-shield-check", desc: "" },
    { key: "tumYetkiler", label: "Tüm Yetkiler", icon: "ti-list-check", desc: "" },
    { key: "loglar", label: "Loglar", icon: "ti-history", desc: "" },
    { key: "ayarlar", label: "Ayarlar", icon: "ti-settings", desc: "" },
];