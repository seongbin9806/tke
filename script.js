let originData = [];
const geocoder = new kakao.maps.services.Geocoder();

window.onload = function() {
    const fileName = '관리현황 25-8.xlsx';

    fetch(fileName)
        .then(response => response.arrayBuffer())
        .then(data => {
            const workbook = XLSX.read(data, { type: 'array' });
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

            const titleRow = jsonData[2] || [];
            // No.를 제외한 4개 항목 정의
            const targetTitles = ["현  장  명", "호기", "주        소", "연락처"];
            const colIndices = targetTitles.map(title => titleRow.indexOf(title));

            // 데이터 추출 (No. 없이 4개 컬럼만)
            originData = jsonData.slice(3, 751).map(row => {
                return colIndices.map(index => (index !== -1 ? (row[index] || '') : ''));
            });            

            renderTable(targetTitles, originData);
        });
};

function renderTable(headers, rows) {
    const container = document.getElementById('tableContainer');
    let html = '<table id="dataTable"><thead><tr>';
    headers.forEach(h => html += `<th>${h}</th>`);
    html += '</tr></thead><tbody>';

    rows.forEach(row => {
        html += '<tr>';
        const siteName = row[0] || ''; // 현장명 (Index 0)
        const address = row[2] || '';  // 주소 (Index 2)

        row.forEach((cell, index) => {
            let content = cell || '';

            // 주소 컬럼 (Index 2)
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
            // 연락처 컬럼 (Index 3)
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

function openMap(type, address, siteName) {
    if (!address) return alert("주소 정보가 없습니다.");

    geocoder.addressSearch(address, function(result, status) {
        if (status === kakao.maps.services.Status.OK) {
            const x = result[0].x;
            const y = result[0].y;
            
            let mapUrl = "";
            if (type === 'kakao') {
                // 웹 링크 형식이므로 현재 창에서 이동
                mapUrl = `https://map.kakao.com/link/to/${siteName},${y},${x}`;
            } else if (type === 'naver') {
                mapUrl = `nmap://route/car?dlat=${y}&dlng=${x}&dname=${siteName}`;
            } else if (type === 'tmap') {
                mapUrl = `tmap://route?goalname=${siteName}&goalx=${x}&goaly=${y}`;                
            }

            // 모든 지도 앱/웹을 현재 창에서 실행
            location.href = mapUrl;
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