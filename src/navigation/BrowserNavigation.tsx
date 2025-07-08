import { BrowserRouter, Route, Routes } from "react-router-dom";
import Home from "../pages/home/home";
import MenuBar from "../components/menu/MenuBar";
import InboxPlan from "../pages/inbox/InboxPlan";
import ProductRoadmap from "../pages/roadMap/roadMap";
import GoogleSuccess from "../../src/pages/auth/GoogleSuccess";


const BrowserNavigation: React.FC = () => {
    return (
        <BrowserRouter>
            <div>
                <MenuBar />
                <div className={`flex-1 min-h-screen md:pl-64`}> {/* Thêm pl-64 để tránh sidebar */}
                    <Routes>
                        <Route path="/search" element={<div>Kế hoạch của tôi</div>} />
                        <Route path="/" element={<Home />} />
                        <Route path="/inbox" element={<InboxPlan />} />
                        <Route path="/product-roadmap" element={<ProductRoadmap/>} />
                        <Route path="/auth/success" element={<GoogleSuccess />} />
                        <Route path="/his-ai-plan" element={<div>Lịch sử kế hoạch AI</div>} />
                        <Route path="/stack" element={<div>Công nghệ sử dụng</div>} />
                        <Route path="*" element={<div>404 - Trang không tìm thấy</div>} />
                    </Routes>
                </div>
            </div>
        </BrowserRouter>
    );
};

export default BrowserNavigation;