
// 登入狀態，登入成功後轉跳管理頁面
export const jumpAlert = async (mode, title, status) => {
  await swal({
    title: title,
    text: "",
    icon: status,
    button: false,
    timer: 2500,
  });
  
  if (mode === 'login' || mode === 'check') {
    // 登入、登入狀態檢查
    window.location = status === 'success' ? 'admin.html' : 'index.html';
  } else if (mode === 'logout') {
    // 登出
    window.location = status === 'success' ? 'index.html' : 'admin.html';
  };
};