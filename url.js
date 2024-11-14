// 用 JavaScript 动态填充 select 选项
window.onload = function() {
    // 定义后端地址、短链接地址和规则地址
    const backends = [
        { name: "自用", value: "https://sub.lzjss.eu.org" },
        { name: "六花", value: "https://api.iraryun.com/sub" },
        { name: "肥羊增强型后端", value: "https://api.v1.mk" }
    ];

    const shortLinks = [
        { name: "自用", value: "https://dlj.lzjss.eu.org/short" },
        { name: "v1.mk", value: "https://v1.mk/short" }
    ];

    const remoteConfigs = [
        { name: "自用", value: "https://raw.githubusercontent.com/xyysjd/ClashRule/main/GeneralClashRule.ini" },
        { name: "ACL_默认版", value: "https://raw.githubusercontent.com/ACL4SSR/ACL4SSR/master/Clash/config/ACL4SSR_Online.ini" }
    ];

    const subtypes = [
        { name: "Clash 配置", value: "clash" },
        { name: "singbox 配置", value: "singbox" },
		{ name: "surfboard 配置", value: "surfboard" },
		{ name: "Quantumult X 配置", value: "quanx" }
    ];

    // 填充后端地址 select
    fillSelect("customBackend", backends);

    // 填充短链接后端 select
    fillSelect("shortTypes", shortLinks);

    // 填充规则地址 select
    fillSelect("remoteConfig", remoteConfigs);

    // 填充生成类型 select
    fillSelect("subtype", subtypes);
};

// 动态填充 select 元素的函数
function fillSelect(id, options) {
    const selectElement = document.getElementById(id);
    selectElement.innerHTML = ""; // 清空当前选项

    options.forEach(option => {
        const optionElement = document.createElement("option");
        optionElement.value = option.value;
        optionElement.textContent = option.name;
        selectElement.appendChild(optionElement);
    });
}