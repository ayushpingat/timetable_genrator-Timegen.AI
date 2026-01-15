// =============================================================================
// RESULTS PAGE - Display Timetable in Table Format
// =============================================================================

let globalTimetables = null;
let globalDays = null;
let globalConfig = null;

function loadResults() {
    // Retrieve data from sessionStorage (set by previous page)
    const storedData = sessionStorage.getItem("timetableData");
    
    if (!storedData) {
        document.getElementById("loadingMsg").innerText = "No timetable data found!";
        return;
    }

    try {
        const data = JSON.parse(storedData);
        globalTimetables = data.timetables;
        globalDays = data.days;
        globalConfig = data.config;

        displayTimetables();
        document.getElementById("loadingMsg").style.display = "none";
    } catch (error) {
        console.error("Error parsing timetable data:", error);
        document.getElementById("loadingMsg").innerText = "Error loading timetable!";
    }
}

function displayTimetables() {
    if (!globalTimetables || !globalDays) {
        return;
    }

    const container = document.getElementById("resultsContent");
    container.innerHTML = "";

    // Display each division's timetable
    globalTimetables.forEach((timetable, divIndex) => {
        const divSection = document.createElement("div");
        divSection.className = "division-section";

        // Division Title
        const title = document.createElement("div");
        title.className = "division-title";
        title.innerText = `Division ${divIndex + 1}`;
        divSection.appendChild(title);

        // Create table
        const table = document.createElement("table");
        
        // Header row with days
        const headerRow = document.createElement("tr");
        const periodHeader = document.createElement("th");
        periodHeader.innerText = "Period";
        headerRow.appendChild(periodHeader);

        globalDays.forEach(day => {
            const dayHeader = document.createElement("th");
            dayHeader.innerText = day;
            headerRow.appendChild(dayHeader);
        });
        table.appendChild(headerRow);

        // Data rows (periods)
        timetable.forEach((row, periodIndex) => {
            const tr = document.createElement("tr");
            
            // Period column
            const periodCell = document.createElement("td");
            periodCell.style.fontWeight = "bold";
            periodCell.innerText = `P${periodIndex + 1}`;
            tr.appendChild(periodCell);

            // Subject cells for each day
            row.forEach(cell => {
                const td = document.createElement("td");
                td.innerHTML = formatCellContent(cell);
                
                // Apply styling based on type
                if (cell && cell.type === "break") {
                    td.className = "break-cell";
                } else if (cell && cell.type === "practical") {
                    td.className = "subject-practical";
                } else if (cell && cell.type === "theory") {
                    td.className = "subject-theory";
                }

                tr.appendChild(td);
            });

            table.appendChild(tr);
        });

        divSection.appendChild(table);
        container.appendChild(divSection);
    });
}

function formatCellContent(cell) {
    if (!cell) {
        return "";
    }

    // Handle breaks
    if (cell.type === "break") {
        return "BREAK";
    }

    // Handle continuation (second period of practical)
    if (cell.is_continuation) {
        return "↑ PRACTICAL (Contd.)";
    }

    // Format subject, faculty, and lab info
    let content = `<strong>${cell.subject}</strong>`;

    if (cell.faculty) {
        content += `<br><small>Faculty: ${cell.faculty}</small>`;
    }

    if (cell.lab) {
        content += `<br><small>${cell.lab}</small>`;
    }

    if (cell.type === "practical") {
        content += `<br><small style="color:#8B4513;">[PRACTICAL]</small>`;
    } else if (cell.type === "theory") {
        content += `<br><small style="color:#1F4E78;">[THEORY]</small>`;
    }

    return content;
}

function downloadPDF() {
    const sendData = {
        timetables: globalTimetables,
        days: globalDays,
        config: globalConfig
    };

    fetch("/api/download-pdf", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(sendData)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error("Failed to download PDF");
        }
        return response.blob();
    })
    .then(blob => {
        // Create download link
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "timetable.pdf";
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    })
    .catch(error => {
        console.error("Error downloading PDF:", error);
        alert("Failed to download PDF. Please try again.");
    });
}

function goBack() {
    // Clear session storage and redirect
    sessionStorage.removeItem("timetableData");
    window.location.href = "/entry";
}
