export default function Ayarlar() {
    return (
        <div className="ypw-tab-view">
            <div className="ypw-tab-head">
                <div>
                    <h2>Ayarlar</h2>
                </div>
            </div>

            <div className="ypw-settings-grid">
                <div className="ypw-setting-card">
                    <i className="ti ti-user-plus" />
                    <strong>Varsayılan kullanıcı rolü</strong>
                </div>

                <div className="ypw-setting-card">
                    <i className="ti ti-shield-half" />
                    <strong>Admin kilidi</strong>
                </div>

                <div className="ypw-setting-card">
                    <i className="ti ti-device-floppy" />
                    <strong>Kayıt kısayolu</strong>
                </div>
            </div>
        </div>
    );
}