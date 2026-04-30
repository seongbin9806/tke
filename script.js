let originData = []; // 필터링을 위한 원본 데이터 저장용

window.onload = function() {
    const fileName = '관리현황 25-8.xlsx';

    fetch(fileName)
        .then(response => {
            if (!response.ok) throw new Error('파일을 찾을 수 없습니다.');
            return response.arrayBuffer();
        })
        .then(data => {
            const workbook = XLSX.read(data, { type: 'array' });
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

            const titleRow = jsonData[2] || [];
            const targetTitles = ["현  장  명", "호기", "주        소", "연락처"];
            const colIndices = targetTitles.map(title => titleRow.indexOf(title));

            // 데이터 추출 및 가공
            originData = jsonData.slice(3, 751).map(row => {
                return colIndices.map(index => (index !== -1 ? (row[index] || '') : ''));
            });
                        
            renderTable(targetTitles, originData);
        })
        .catch(error => {
            document.getElementById('tableContainer').innerHTML = `<p style="color:red;">${error.message}</p>`;
        });
};

// 카카오 주소->좌표 변환 객체 초기화
const geocoder = new kakao.maps.services.Geocoder();

function renderTable(headers, rows) {
    const container = document.getElementById('tableContainer');
    let html = '<table id="dataTable"><thead><tr>';
    headers.forEach(h => html += `<th>${h}</th>`);
    html += '</tr></thead><tbody>';

    rows.forEach(row => {
        html += '<tr>';
        const siteName = row[1] || ''; // 현장명
        const address = row[2] || '';  // 주소 (인덱스 확인 필요)

        row.forEach((cell, index) => {
            let content = cell || '';

            // 주소 컬럼 (인덱스 2번 가정)
            if (index === 2 && content !== '') {
                content = `
                    <div class="address-cell">
                        <span class="addr-text">${content}</span>
                        <div class="map-icons">
                            <img src="kakao_map.png" alt="카카오" onclick="openMap('kakao', '${address}', '${siteName}')">
                            <img src="naver_map.png" alt="네이버" onclick="openMap('naver', '${address}', '${siteName}')">
                            <img src="tmap.jpeg" alt="티맵" onclick="openMap('tmap', '${address}', '${siteName}')">
                        </div>
                    </div>`;
            }
            // 연락처 컬럼 (인덱스 3번 가정)
            else if (index === 3 && content !== '') {
                const telNum = content.replace(/[^0-9]/g, '');
                content = `<a href="tel:${telNum}" class="tel-link">${content}</a>`;
            }

            html += `<td>${content}</td>`;
        });
        html += '</tr>';
    });

    html += '</tbody></table>';
    container.innerHTML = html;
}

// 아이콘 클릭 시 실행되는 함수
function openMap(type, address, siteName) {
    if (!address) return alert("주소 정보가 없습니다.");

    // 주소를 좌표로 변환
    geocoder.addressSearch(address, function(result, status) {
        if (status === kakao.maps.services.Status.OK) {
            const x = result[0].x; // 경도
            const y = result[0].y; // 위도
            const encodedSite = encodeURIComponent(siteName);
            
            let mapUrl = "";

            if (type === 'kakao') {
                // 카카오맵 목적지 설정 (이름, 위도, 경도)
                mapUrl = `https://map.kakao.com/link/to/${encodedSite},${y},${x}`;
            } else if (type === 'naver') {
                // 네이버 지도 앱 스킴 (설치 안된 경우 브라우저 처리)
                mapUrl = `nmap://route/car?dlat=${y}&dlng=${x}&dname=${encodedSite}`;
                // 만약 웹으로만 열고 싶다면: 
                // mapUrl = `https://map.naver.com/v5/search/${encodeURIComponent(address + ' ' + siteName)}`;
            } else if (type === 'tmap') {
                // 티맵 앱 스킴
                mapUrl = `tmap://route?goalname=${encodedSite}&goallat=${y}&goallng=${x}`;
            }

            // 앱 스킴 실행 시도 (네이버/티맵 등)
            if (type !== 'kakao') {
                location.href = mapUrl;
                // 앱이 없을 경우를 대비해 0.5초 후 반응 없으면 웹 지도로 유도하는 로직을 추가할 수도 있습니다.
            } else {
                window.open(mapUrl, '_blank');
            }

        } else {
            alert("좌표를 찾을 수 없는 주소입니다.");
        }
    });
}

// 실시간 검색 필터링
function filterTable() {
    const input = document.getElementById('searchInput').value.toLowerCase();
    const table = document.getElementById('dataTable');
    const tr = table.getElementsByTagName('tr');

    for (let i = 1; i < tr.length; i++) {
        const siteName = tr[i].getElementsByTagName('td')[0]; // 현장명 컬럼
        if (siteName) {
            const txtValue = siteName.textContent || siteName.innerText;
            tr[i].style.display = txtValue.toLowerCase().indexOf(input) > -1 ? "" : "none";
        }
    }
}