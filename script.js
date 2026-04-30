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

// 테이블 렌더링 함수
function renderTable(headers, rows) {
    const container = document.getElementById('tableContainer');
    let html = '<table id="dataTable"><thead><tr>';
    headers.forEach(h => html += `<th>${h}</th>`);
    html += '</tr></thead><tbody>';

    rows.forEach(row => {
        html += '<tr>';
        
        row.forEach((cell, index) => {
            let content = cell || '';

            // 4번째 컬럼 (주소 - 인덱스 3)
            if (index === 2 && content !== '') {
                const encodedAddr = encodeURIComponent(content);
                content = `
                    <div class="address-cell">
                        <span class="addr-text">${content}</span>
                        <div class="map-icons">
                            <a href="https://map.kakao.com/link/search/${encodedAddr}" target="_blank">
                                <img src="kakao_map.png" alt="카카오지도">
                            </a>                            
                            <a href="https://map.naver.com/v5/search/${encodedAddr}" target="_blank">
                                <img src="naver_map.png" alt="네이버지도">
                            </a>
                            <a href="nmap://route/car?slat=37.3595953&slng=127.1053971&sname=%EA%B7%B8%EB%A6%B0%ED%8C%A9%ED%86%A0%EB%A6%AC&secoords=37.359761,127.10527&dlng=127.1267772&dlat=37.4200267&dname=%EC%84%B1%EB%82%A8%EC%8B%9C%EC%B2%AD&decoords=37.4189564,127.1256827&v1lng=126.9522394&v1lat=37.464007&v1name=%20%EC%84%9C%EC%9A%B8%EB%8C%80%ED%95%99%EA%B5%90&v1ecoords=37.466358,126.948357&appname=com.example.myapp" target="_blank">
                                <img src="naver_map.png" alt="네이버지도">
                            </a>                            
                        </div>
                    </div>`;
            }
            
            // 5번째 컬럼 (연락처 - 인덱스 4)
            else if (index === 3 && content !== '') {
                // 숫자만 추출하여 전화번호 형식 생성
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