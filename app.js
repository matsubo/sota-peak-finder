// Service Workerの登録
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('service-worker.js')
            .then(registration => {
                console.log('Service Worker registered:', registration);
            })
            .catch(error => {
                console.log('Service Worker registration failed:', error);
            });
    });
}

// オンライン/オフライン状態の監視
function updateOnlineStatus() {
    const statusElement = document.getElementById('onlineStatus');
    if (navigator.onLine) {
        statusElement.textContent = 'オンライン';
        statusElement.style.background = 'rgba(76, 175, 80, 0.3)';
    } else {
        statusElement.textContent = 'オフライン';
        statusElement.style.background = 'rgba(255, 152, 0, 0.3)';
    }
}

window.addEventListener('online', updateOnlineStatus);
window.addEventListener('offline', updateOnlineStatus);
updateOnlineStatus();

// JCC/JCGデータのロード
let locationData = null;

async function loadLocationData() {
    try {
        const response = await fetch('data/location-data.json');
        locationData = await response.json();
        console.log('Location data loaded');
    } catch (error) {
        console.error('Failed to load location data:', error);
    }
}

// 度分秒（DMS）形式への変換
function convertToDMS(decimal, isLatitude) {
    const absolute = Math.abs(decimal);
    const degrees = Math.floor(absolute);
    const minutesDecimal = (absolute - degrees) * 60;
    const minutes = Math.floor(minutesDecimal);
    const seconds = ((minutesDecimal - minutes) * 60).toFixed(2);

    let direction;
    if (isLatitude) {
        direction = decimal >= 0 ? 'N' : 'S';
    } else {
        direction = decimal >= 0 ? 'E' : 'W';
    }

    return `${degrees}°${minutes}'${seconds}" ${direction}`;
}

// Maidenhead Grid Locator (グリッドロケーター) の計算
function calculateGridLocator(lat, lon) {
    // 経度を0-360の範囲に変換
    let adjustedLon = lon + 180;
    // 緯度を0-180の範囲に変換
    let adjustedLat = lat + 90;

    // Field (18x18の大区画、A-R)
    const fieldLon = String.fromCharCode(65 + Math.floor(adjustedLon / 20));
    const fieldLat = String.fromCharCode(65 + Math.floor(adjustedLat / 10));

    // Square (10x10の中区画、0-9)
    adjustedLon = adjustedLon % 20;
    adjustedLat = adjustedLat % 10;
    const squareLon = Math.floor(adjustedLon / 2);
    const squareLat = Math.floor(adjustedLat / 1);

    // Subsquare (24x24の小区画、a-x)
    adjustedLon = (adjustedLon % 2) * 60;
    adjustedLat = (adjustedLat % 1) * 60;
    const subsquareLon = String.fromCharCode(97 + Math.floor(adjustedLon / 5));
    const subsquareLat = String.fromCharCode(97 + Math.floor(adjustedLat / 2.5));

    // 6桁のグリッドロケーター (例: PM95vr)
    return `${fieldLon}${fieldLat}${squareLon}${squareLat}${subsquareLon}${subsquareLat}`;
}

// 国土地理院APIで標高を取得
async function getElevation(lat, lon) {
    try {
        const url = `https://cyberjapandata2.gsi.go.jp/general/dem/scripts/getelevation.php?lon=${lon}&lat=${lat}&outtype=JSON`;
        const response = await fetch(url);
        const data = await response.json();

        if (data.elevation !== undefined && data.elevation !== null) {
            return Math.round(data.elevation);
        }
    } catch (error) {
        console.log('標高取得エラー:', error);
    }
    return null;
}

// 逆ジオコーディング（OpenStreetMap Nominatim）
async function reverseGeocode(lat, lon) {
    try {
        const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&accept-language=ja`;
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'OfflineQTH/1.0'
            }
        });
        const data = await response.json();

        if (data.address) {
            const addr = data.address;
            const prefecture = addr.state || addr.province || '';
            const city = addr.city || addr.town || addr.village || addr.municipality || '';

            return {
                prefecture: prefecture,
                city: city,
                fullAddress: data.display_name
            };
        }
    } catch (error) {
        console.log('逆ジオコーディングエラー:', error);
    }
    return null;
}

// 位置情報から都道府県・市区町村・JCC/JCGを判定
function findLocationInfo(lat, lon) {
    if (!locationData) {
        return {
            prefecture: '不明',
            city: '不明',
            jcc: '不明',
            jcg: '不明'
        };
    }

    // 最も近い地点を探す（簡易的な実装）
    let minDistance = Infinity;
    let closestLocation = null;

    for (const location of locationData.locations) {
        const distance = Math.sqrt(
            Math.pow(lat - location.lat, 2) +
            Math.pow(lon - location.lon, 2)
        );

        if (distance < minDistance) {
            minDistance = distance;
            closestLocation = location;
        }
    }

    if (closestLocation) {
        return {
            prefecture: closestLocation.prefecture,
            city: closestLocation.city,
            jcc: closestLocation.jcc,
            jcg: closestLocation.jcg
        };
    }

    return {
        prefecture: '不明',
        city: '不明',
        jcc: '不明',
        jcg: '不明'
    };
}

// 位置情報の取得関数
function getLocation() {
    const statusElement = document.getElementById('status');

    if (!navigator.geolocation) {
        statusElement.textContent = '位置情報がサポートされていません';
        return;
    }

    statusElement.textContent = '位置情報を取得中...';

    navigator.geolocation.getCurrentPosition(
        async (position) => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            const altitudeGPS = position.coords.altitude;

            // 位置情報の表示（度分秒形式）
            document.getElementById('latitude').textContent = convertToDMS(lat, true);
            document.getElementById('longitude').textContent = convertToDMS(lon, false);

            // GPS標高の表示（取得できる場合）
            if (altitudeGPS !== null && altitudeGPS !== undefined) {
                document.getElementById('elevation').textContent = `${Math.round(altitudeGPS)}m (GPS)`;
            } else {
                document.getElementById('elevation').textContent = '取得中...';
            }

            // グリッドロケーターの計算（これは常に正確）
            const gridLocator = calculateGridLocator(lat, lon);
            document.getElementById('gridLocator').textContent = gridLocator;

            // 初期状態：取得中と表示
            document.getElementById('prefecture').textContent = '取得中...';
            document.getElementById('city').textContent = '取得中...';
            document.getElementById('jcc').textContent = '取得中...';
            document.getElementById('jcg').textContent = '取得中...';

            // 結果の表示
            document.getElementById('result').style.display = 'block';

            // オンラインの場合、正確な情報を取得
            if (navigator.onLine) {
                statusElement.textContent = '詳細情報を取得中...';

                // 正確な標高を取得
                const elevation = await getElevation(lat, lon);
                if (elevation !== null) {
                    document.getElementById('elevation').textContent = `${elevation}m`;
                } else {
                    document.getElementById('elevation').textContent = '取得失敗';
                }

                // 正確な住所を取得
                const geoData = await reverseGeocode(lat, lon);
                if (geoData) {
                    document.getElementById('prefecture').textContent = geoData.prefecture || '不明';
                    document.getElementById('city').textContent = geoData.city || '不明';
                } else {
                    document.getElementById('prefecture').textContent = '取得失敗';
                    document.getElementById('city').textContent = '取得失敗';
                }

                // JCC/JCGをローカルデータから取得
                const locationInfo = findLocationInfo(lat, lon);
                document.getElementById('jcc').textContent = locationInfo.jcc;
                document.getElementById('jcg').textContent = locationInfo.jcg;

                statusElement.textContent = '位置情報を取得しました';
            } else {
                // オフラインの場合はローカルデータから推定
                statusElement.textContent = 'オフラインモード：推定値を表示';

                const locationInfo = findLocationInfo(lat, lon);
                document.getElementById('prefecture').textContent = locationInfo.prefecture + ' (推定)';
                document.getElementById('city').textContent = locationInfo.city + ' (推定)';
                document.getElementById('jcc').textContent = locationInfo.jcc;
                document.getElementById('jcg').textContent = locationInfo.jcg;
                document.getElementById('elevation').textContent = '取得不可';
            }
        },
        (error) => {
            let errorMessage = '';
            switch(error.code) {
                case error.PERMISSION_DENIED:
                    errorMessage = '位置情報の許可が拒否されました';
                    break;
                case error.POSITION_UNAVAILABLE:
                    errorMessage = '位置情報が取得できません';
                    break;
                case error.TIMEOUT:
                    errorMessage = 'タイムアウトしました';
                    break;
                default:
                    errorMessage = 'エラーが発生しました';
            }
            statusElement.textContent = errorMessage;
        },
        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        }
    );
}

// ボタンクリック時に位置情報取得
document.getElementById('getLocation').addEventListener('click', getLocation);

// ページ読み込み時にデータをロードし、自動的に位置情報を取得
loadLocationData();

// ページ読み込み完了後、自動的に位置情報を取得
window.addEventListener('load', () => {
    // 少し遅延させてから自動取得（Service Worker登録後）
    setTimeout(() => {
        getLocation();
    }, 500);
});
