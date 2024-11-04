export const saveText = async(filename, text) => {
  // #ifdef H5
  // 弹窗选择下载还是复制
  const res = await uni.showModal({
    title: '提示',
    content: '请选择操作',
    showCancel: true,
    confirmText: '保存为文件',
    cancelText: '复制到剪切板',
  });
  if (res.confirm) {
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const objectURL = URL.createObjectURL(blob);
    const linkEle = document.createElement('a');
    linkEle.href = objectURL;
    linkEle.download = filename;
    linkEle.click();
    URL.revokeObjectURL(objectURL);
    return;
  }
  // #endif
  // 保存到剪切板
  await uni.setClipboardData({
    data: text,
    showToast: false
  });
  uni.showModal({
    title: '提示',
    content: '内容已复制到剪切板',
    showCancel: false,
  });

};