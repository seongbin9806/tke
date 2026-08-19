let originData = [];
const targetTitles = ["현  장  명", "계약", "호기", "주        소", "연락처"];
const geocoder = new kakao.maps.services.Geocoder();

window.onload = function() {
    if (location.protocol === 'file:') {
        // 로컬에서 file://로 직접 열었을 때 → 파일 선택 UI 노출
        showLocalFilePicker();
    } else {
        // 서버(http/https)에서 열었을 때 → 기존 방식대로 자동 fetch
        loadFromServer('관리현황 25-8.xlsx');
    }
};

function loadFromServer(fileName) {
    fetch(fileName)
        .then(response => response.arrayBuffer())
        .then(data => processWorkbook(data))
        .catch(err => {
            console.error(err);
            alert('파일을 불러오지 못했습니다: ' + fileName);
        });
}

function showLocalFilePicker() {
    // 파일 입력창을 동적으로 생성해서 tableContainer 위에 삽입
    const container = document.getElementById('tableContainer');
    const wrapper = document.createElement('div');
    wrapper.innerHTML = `
        <div style="margin-bottom:10px;">
            <p>로컬 환경입니다. 엑셀 파일을 직접 선택해주세요.</p>
            <input type="file" id="localFileInput" accept=".xlsx,.xls">
        </div>
    `;
    container.parentNode.insertBefore(wrapper, container);

    document.getElementById('localFileInput').addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function(event) {
            processWorkbook(event.target.result);
        };
        reader.readAsArrayBuffer(file);
    });
}

// fetch든 FileReader든 결과(ArrayBuffer)를 받아서 공통으로 처리
function processWorkbook(arrayBufferData) {
    const workbook = XLSX.read(arrayBufferData, { type: 'array' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    const titleRow = jsonData[2] || [];
    const colIndices = targetTitles.map(title => titleRow.indexOf(title));

    originData = jsonData.slice(3, 751).map(row => {
        return colIndices.map(index => (index !== -1 ? (row[index] || '') : ''));
    });

    renderTable(targetTitles, originData);
}

function renderTable(headers, rows) {
    const container = document.getElementById('tableContainer');
    let html = '<table id="dataTable"><thead><tr>';
        
    headers.forEach(h => {
        if (h === '계약') return;
        html += `<th>${h}</th>`;
    });
    
    html += '</tr></thead><tbody>';

    rows.forEach(row => {        
        const siteName = row[0] || ''; // 현장명 (Index 0)
        const address = row[3] || '';  // 주소 (Index 2)

        html += '<tr>';
        
        row.forEach((cell, index) => {
            let content = cell || '';

            // 주소, 계약
            if(index == 0 || index == 1) {
                if(index == 0) {
                    html += `<td>${content}<br/><br/>`;
                }
                
                if(index == 1) {
                    html += ` <b>계약 - ${content}</b></td>`;                    
                }   
            } else {
                if (index === 3 && content !== '') {                    
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
                // 연락처 컬럼 (Index 4)
                else if (index === 4 && content !== '') {
                    const telNum = content.replace(/[^0-9]/g, '');
                    content = `<a href="tel:${telNum}" class="tel-link">${content}</a>`;
                }

                html += `<td>${content}</td>`;                
            }
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