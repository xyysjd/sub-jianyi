// 动态生成星星
for (let i = 0; i < 100; i++) {
    let starContainer = document.createElement('div');
    starContainer.classList.add('container');

    let star = document.createElement('div');
    star.classList.add('star');

    // 随机大小和位置
    let size = Math.floor(Math.random() * (30 - 2 + 1)) + 2;
    star.style.width = size + 'px';
    star.style.height = size + 'px';
    star.style.top = Math.random() * 100 + 'vh';
    star.style.left = Math.random() * 100 + 'vw';
    star.style.animationDuration = Math.random() * 3 + 1 + 's';
    star.style.animationDelay = Math.random() * 3 + 's';

    starContainer.appendChild(star);
    document.querySelector('.stars').appendChild(starContainer);
}

// 动态生成粒子
for (let i = 0; i < 100; i++) {
    let particle = document.createElement('div');
    particle.classList.add('particle');

    particle.style.left = Math.random() * 100 + 'vw';
    particle.style.top = Math.random() * 100 + 'vh';
    particle.style.animationDuration = Math.random() * 5 + 2 + 's';
    particle.style.animationDelay = Math.random() * 3 + 's';

    document.querySelector('.particles').appendChild(particle);
}

function isValidUrl(str) {
    var pattern = new RegExp('^(https?:\\/\\/)?' + 
                             '(([A-Z0-9](?:[A-Z0-9-]*[A-Z0-9])?\\.)+(?:[A-Z]{2,6}\\.?|[A-Z0-9-]{2,}\\.?)|' +
                             'localhost|' +
                             '\\d{1,3}\\.?\\d{1,3}\\.?\\d{1,3}\\.?\\d{1,3}|' +
                             '\\[?[A-F0-9]*:[A-F0-9:]+\\]?)' +
                             '(\\:\\d+)?(\\/[-A-Z0-9+&@#/%=~_|$?!:,.]*[-A-Z0-9+&@#/%=~_|$])?', 'i');
    return pattern.test(str);
}

function createLinkCard(title, link, containerId) {
    const container = document.querySelector('.links-container');
    const existingCard = document.getElementById(`${containerId}-card`);
    
    if (existingCard) {
        existingCard.querySelector('.link-content').textContent = link;
        return;
    }
    
    const card = document.createElement('div');
    card.id = `${containerId}-card`;
    card.className = 'link-card';
    card.innerHTML = `
        <h3>${title}</h3>
        <div class="link-content">${link}</div>
        <div class="copy-indicator">✓ 已复制到剪贴板</div>
    `;
    
    container.appendChild(card);
}

function create() {
    var kd = document.getElementById('kd');
    var textInput = document.getElementById('textInput');
    var customBackend = document.getElementById('customBackend');
    var remoteConfig = document.getElementById('remoteConfig');
    var subtype = document.getElementById('subtype');
    var formData = new FormData();

    var inputText = textInput.value.trim();
    var backendUrl = customBackend.value.trim();
    var remotUrl = remoteConfig.value.trim();
    
    // 处理多个URL
    var urls = inputText.split('\n').map(url => url.trim()).filter(url => url !== '').join('|');

    if (isValidUrl(urls)) {
        var url = backendUrl + '/sub?target=' + encodeURIComponent(subtype.value) + 
                  '&url=' + encodeURIComponent(urls) + 
                  '&insert=false' +
				  '&scv=true' +
                  '&config=' + encodeURIComponent(remotUrl);				  
        kd.href = url;
        createLinkCard('订阅链接', url, 'kd');
        copyLink('kd');  // 自动复制链接
    } else if (inputText !== "") {
        var encodedText = btoa(inputText.replace(/\n/g, "\n"));
        var blob = new Blob([encodedText], { type: 'text/plain' });
        var file = new File([blob], 'subscription.txt', { type: 'text/plain' });
        
        formData.append("file", file);

        fetch("https://sub.xpy.us.kg/upload", {
            method: "POST",
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            var rawUrl = data.rawUrl;
            var url = backendUrl + '/sub?target=' + encodeURIComponent(subtype.value) + 
                      '&url=' + encodeURIComponent(rawUrl) + 
                      '&insert=false' +
					  '&scv=true' +
                      '&config=' + encodeURIComponent(remotUrl);
            kd.href = url;
            createLinkCard('订阅链接', url, 'kd');
            copyLink('kd');  // 自动复制链接
        })
        .catch(error => {
            alert("文本上传失败: " + error);
        });
    } else {
        alert("请提供有效的文本或链接！");
    }
}



function createShortLink() {
    var kd = document.getElementById('kd');
    var shortTypes = document.getElementById('shortTypes');

    if (kd && kd.href && kd.href.trim() !== '') {
        var longUrl = kd.href;
        var encodedUrl = btoa(longUrl);

        // 根据选择的短链接后端修改请求 URL
        var shortLinkBackend = shortTypes.value;

        fetch(shortLinkBackend, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: 'longUrl=' + encodeURIComponent(encodedUrl)
        })
        .then(response => response.json())
        .then(data => {
            if (data.Code === 1 && data.ShortUrl) {
                createLinkCard('短链接', data.ShortUrl, 'shortLink');
                copyLink('shortLink');  // 自动复制短链接
            } else {
                alert("短链接生成失败");
            }
        })
        .catch(error => {
            console.error('生成短链接时出错:', error);
        });
    } else {
        alert('请先生成有效的订阅链接');
    }
}



function copyLink(elementId) {
    const card = document.getElementById(`${elementId}-card`);
    if (!card) return;
    
    const linkContent = card.querySelector('.link-content').textContent;
    const copyIndicator = card.querySelector('.copy-indicator');
    
    if (linkContent) {
        navigator.clipboard.writeText(linkContent).then(() => {
            copyIndicator.style.opacity = '1';
            setTimeout(() => {
                copyIndicator.style.opacity = '0';
            }, 2000);
        }).catch(err => {
            alert('复制失败，请手动复制');
        });
    } else {
        alert("链接无效或未生成");
    }
}