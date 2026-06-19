import { Navigate, Route, Routes } from "react-router-dom";

import Login from "./pages/Login";
import Layout from "./components/Layout/Layout";
import Anasayfa from "./pages/Anasayfa";

import Planlama from "./pages/bimafyon/planlama";
import ManuelSiparis from "./pages/bimafyon/manuelsiparis";
import AktifSeferler from "./pages/bimafyon/aktifseferler";
import SilinenSeferler from "./pages/bimafyon/silinenseferler";
import TamamlananSeferler from "./pages/bimafyon/tamamlananseferler";
import QrOkutma from "./pages/bimafyon/aktifseferler/qrokutma";

import Araclar from "./pages/aracyonetimi/araclar";

import DonusSiparis from "./pages/Donusler/Siparis";
import DonusPlakaAtama from "./pages/Donusler/PlakaAtama";
import DonusTamamlananSeferler from "./pages/Donusler/TamamlananSeferler";
import DonusNavlunlar from "./pages/Donusler/Navlunlar";

import Vkn from "./pages/ekkayitlar/vkn";
import UgramaSart from "./pages/ekkayitlar/ugramasart";
import NavlunSart from "./pages/ekkayitlar/navlunsart";

function App() {
    return (
        <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />

            <Route element={<Layout />}>
                <Route path="/anasayfa" element={<Anasayfa />} />

                <Route path="/bimafyon/planlama" element={<Planlama />} />
                <Route path="/bimafyon/manuelsiparis" element={<ManuelSiparis />} />
                <Route path="/bimafyon/aktifseferler" element={<AktifSeferler />} />
                <Route path="/bimafyon/silinenseferler" element={<SilinenSeferler />} />

                <Route
                    path="/bimafyon/tamamlananseferler"
                    element={<TamamlananSeferler />}
                />

                <Route
                    path="/bimafyon/aktifseferler/qrokutma"
                    element={<QrOkutma onSuccess={() => { }} />}
                />

                <Route path="/aracyonetimi/araclar" element={<Araclar />} />

                <Route path="/donusler/siparis" element={<DonusSiparis />} />
                <Route path="/donusler/plakaatama" element={<DonusPlakaAtama />} />

                <Route
                    path="/donusler/tamamlananseferler"
                    element={<DonusTamamlananSeferler />}
                />

                <Route path="/donusler/navlunlar" element={<DonusNavlunlar />} />

                <Route path="/ekkayitlar/vkn" element={<Vkn />} />
                <Route path="/ekkayitlar/ugrama" element={<UgramaSart />} />
                <Route path="/ekkayitlar/navlun" element={<NavlunSart />} />
            </Route>
        </Routes>
    );
}

export default App;