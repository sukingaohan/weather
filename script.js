document.addEventListener('DOMContentLoaded', () => {
    // DOM 元素
    const settingsBtn = document.getElementById('settings-btn');
    const settingsModal = document.getElementById('settings-modal');
    const settingsForm = document.getElementById('settings-form');
    const apiKeyInput = document.getElementById('api-key');
    const locationInput = document.getElementById('location');
    const card = document.getElementById('current-weather-card');
    const forecastContainer = document.querySelector('.forecast-container');

    console.log("--- 脚本已加载，等待用户操作 ---");

    const weatherMap = {
        'CLEAR_DAY': { name: '晴', className: 'sunny', icon: 'fa-sun' },
        'CLEAR_NIGHT': { name: '晴', className: 'sunny', icon: 'fa-moon' },
        'PARTLY_CLOUDY_DAY': { name: '多云', className: 'cloudy', icon: 'fa-cloud-sun' },
        'PARTLY_CLOUDY_NIGHT': { name: '多云', className: 'cloudy', icon: 'fa-cloud-moon' },
        'CLOUDY': { name: '阴', className: 'cloudy', icon: 'fa-cloud' },
        'LIGHT_HAZE': { name: '轻度雾霾', className: 'cloudy', icon: 'fa-smog' },
        'MODERATE_HAZE': { name: '中度雾霾', className: 'cloudy', icon: 'fa-smog' },
        'HEAVY_HAZE': { name: '重度雾霾', className: 'cloudy', icon: 'fa-smog' },
        'LIGHT_RAIN': { name: '小雨', className: 'rainy', icon: 'fa-cloud-rain' },
        'MODERATE_RAIN': { name: '中雨', className: 'rainy', icon: 'fa-cloud-showers-heavy' },
        'HEAVY_RAIN': { name: '大雨', className: 'rainy', icon: 'fa-cloud-showers-heavy' },
        'STORM_RAIN': { name: '暴雨', className: 'rainy', icon: 'fa-poo-storm' },
        'FOG': { name: '雾', className: 'cloudy', icon: 'fa-smog' },
        'LIGHT_SNOW': { name: '小雪', className: 'snowy', icon: 'fa-snowflake' },
        'MODERATE_SNOW': { name: '中雪', className: 'snowy', icon: 'fa-snowflake' },
        'HEAVY_SNOW': { name: '大雪', className: 'snowy', icon: 'fa-snowflake' },
        'STORM_SNOW': { name: '暴雪', className: 'snowy', icon: 'fa-snowflake' },
        'DUST': { name: '浮尘', className: 'cloudy', icon: 'fa-wind' },
        'SAND': { name: '沙尘', className: 'cloudy', icon: 'fa-wind' },
        'WIND': { name: '大风', className: 'cloudy', icon: 'fa-wind' },
    };

    const showSettingsModal = () => settingsModal.classList.remove('hidden');
    const hideSettingsModal = () => settingsModal.classList.add('hidden');

    settingsForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const apiKey = apiKeyInput.value.trim();
        const location = locationInput.value.trim();
        if (apiKey && location) {
            localStorage.setItem('weatherApiKey', apiKey);
            localStorage.setItem('weatherLocation', location);
            hideSettingsModal();
            fetchWeather(apiKey, location);
        }
    });

    settingsBtn.addEventListener('click', () => {
        apiKeyInput.value = localStorage.getItem('weatherApiKey') || '';
        locationInput.value = localStorage.getItem('weatherLocation') || '';
        showSettingsModal();
    });

    async function fetchWeather(apiKey, location) {
        card.innerHTML = `<div class="weather-icon"><i class="fas fa-spinner fa-spin"></i></div><p class="weather-desc">正在加载天气...</p>`;
        forecastContainer.innerHTML = '';

        const apiUrl = `https://api.caiyunapp.com/v2.6/${apiKey}/${location}/weather.json?unit=metric:v2&dailysteps=3`;
        
        console.log("LOG 1: 开始获取天气数据, 请求URL:", apiUrl);

        try {
            const response = await fetch(apiUrl);
            console.log("LOG 2: 收到服务器响应 (Response)", response);

            if (!response.ok) {
                throw new Error(`HTTP 错误! 状态码: ${response.status}`);
            }

            const data = await response.json();
            console.log("LOG 3: 成功解析JSON数据 (Data)", data);

            if (data.status === 'ok') {
                console.log("LOG 4: API状态为'ok', 准备更新UI...");
                updateUI(data.result);
                console.log("LOG 6: UI更新函数执行完毕。");
            } else {
                throw new Error(`API 业务错误: ${data.error}`);
            }
        } catch (error) {
            console.error("!!! 捕获到错误 !!! (Error caught)", error);
            card.innerHTML = `<div class="weather-icon"><i class="fas fa-exclamation-triangle"></i></div><p class="weather-desc">加载失败: ${error.message}<br>请按F12打开控制台查看详细错误日志。</p>`;
        }
    }

    function updateUI(result) {
        console.log("LOG 5: 进入updateUI函数, 接收到的数据 (Result)", result);
        
        const { realtime, hourly, daily, alert, minutely } = result;

        // 1. 更新当前天气
        const currentWeather = weatherMap[realtime.skycon] || {};
        card.className = 'card ' + currentWeather.className;
        card.innerHTML = `
            <div class="weather-icon"><i class="fas ${currentWeather.icon || 'fa-question-circle'}"></i></div>
            <h2 class="weather-title">${currentWeather.name || '未知'}</h2>
            <div class="temp">${Math.round(realtime.temperature)}°C</div>
            <p class="weather-desc">${minutely?.description || '今日天气概览'}</p>
            <div class="details">
                <div class="detail-item"><i class="fas fa-temperature-half"></i><p>体感 ${Math.round(realtime.apparent_temperature)}°C</p></div>
                <div class="detail-item"><i class="fas fa-tint"></i><p>湿度 ${Math.round(realtime.humidity * 100)}%</p></div>
                <div class="detail-item"><i class="fas fa-wind"></i><p>风速 ${realtime.wind.speed.toFixed(1)} km/h</p></div>
            </div>`;
        document.getElementById('location-name').textContent = alert?.content[0]?.location || '天气预报';

        // 2. 更新预报容器
        let forecastHTML = '';
        console.log("  - 准备处理小时级预报, 数据:", hourly);
        // 4小时后
        if (hourly && hourly.skycon?.length > 4 && hourly.temperature?.length > 4) {
            const hourlyWeather = weatherMap[hourly.skycon[4].value] || {};
            forecastHTML += `<div class="forecast-card"><h3>4小时后</h3><div class="weather-icon"><i class="fas ${hourlyWeather.icon || 'fa-question-circle'}"></i></div><div class="temp">${Math.round(hourly.temperature[4].value)}°C</div><div class="weather-title">${hourlyWeather.name || '--'}</div></div>`;
        } else {
             forecastHTML += `<div class="forecast-card"><h3>4小时后</h3><div class="weather-icon"><i class="fas fa-clock"></i></div><p style="margin-top:20px;">预报数据不足</p></div>`;
        }

        console.log("  - 准备处理天级预报, 数据:", daily);
        // 明天
        if (daily && daily.skycon?.length > 1 && daily.temperature?.length > 1) {
            const tomorrowWeather = weatherMap[daily.skycon[1].value] || {};
            forecastHTML += `<div class="forecast-card"><h3>明天</h3><div class="weather-icon"><i class="fas ${tomorrowWeather.icon || 'fa-question-circle'}"></i></div><div class="temp">${Math.round(daily.temperature[1].min)}°/${Math.round(daily.temperature[1].max)}°</div><div class="weather-title">${tomorrowWeather.name || '--'}</div></div>`;
        } else {
            forecastHTML += `<div class="forecast-card"><h3>明天</h3><div class="weather-icon"><i class="fas fa-calendar-day"></i></div><p style="margin-top:20px;">预报数据不足</p></div>`;
        }

        // 后天
        if (daily && daily.skycon?.length > 2 && daily.temperature?.length > 2) {
            const dayAfterWeather = weatherMap[daily.skycon[2].value] || {};
            forecastHTML += `<div class="forecast-card"><h3>后天</h3><div class="weather-icon"><i class="fas ${dayAfterWeather.icon || 'fa-question-circle'}"></i></div><div class="temp">${Math.round(daily.temperature[2].min)}°/${Math.round(daily.temperature[2].max)}°</div><div class="weather-title">${dayAfterWeather.name || '--'}</div></div>`;
        } else {
            forecastHTML += `<div class="forecast-card"><h3>后天</h3><div class="weather-icon"><i class="fas fa-calendar-week"></i></div><p style="margin-top:20px;">预报数据不足</p></div>`;
        }
        
        forecastContainer.innerHTML = forecastHTML;
    }

    function init() {
        console.log("--- 页面初始化 ---");
        const savedApiKey = localStorage.getItem('weatherApiKey');
        const savedLocation = localStorage.getItem('weatherLocation');
        if (savedApiKey && savedLocation) {
            console.log("在本地存储中找到配置, 准备获取天气...");
            fetchWeather(savedApiKey, savedLocation);
        } else {
            console.log("未找到本地配置, 显示设置窗口。");
            showSettingsModal();
        }
    }

    init();
});
