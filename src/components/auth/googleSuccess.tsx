import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../../context/useUser";

const GoogleSuccess: React.FC = () => {
  const [showPopup, setShowPopup] = useState(true);
  const navigate = useNavigate();
  const { setUserAndToken } = useUser();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const accessToken = params.get("accessToken");
    const userStr = params.get("user"); // nếu backend trả về user dạng JSON string
    const user = userStr ? JSON.parse(decodeURIComponent(userStr)) : null;
    if (accessToken && user) {
      setUserAndToken(user, accessToken);
    }
  }, [setUserAndToken]);

  const handleClose = () => {
    setShowPopup(false);
    navigate("/");
  };

  return (
    showPopup && (
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-sm w-full text-center">
          <img src="/google.png" alt="Google" className="w-12 h-12 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2 text-green-600">Đăng nhập Google thành công!</h2>
          <p className="mb-4 text-gray-700">Bạn đã đăng nhập bằng Google thành công.</p>
          <button
            onClick={handleClose}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Vào trang chủ
          </button>
        </div>
      </div>
    )
  );
};

export default GoogleSuccess;