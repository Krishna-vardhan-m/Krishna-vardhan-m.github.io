let map;
let projectsData = []; // This will hold your JSON data
let markers = [];
let infoWindow;
let directionsService;
let directionsRenderer;
// When true, suppress showing the plot modal (used while loading/rendering site)
let suppressPlotModal = false;

const HYDERABAD_CENTER = { lat: 17.3850, lng: 78.4867 }; // Approximate center of Hyderabad

// Initialize Google Map
async function initMap() {
    // Basic setup for the map
    map = new google.maps.Map(document.getElementById('map'), {
        center: HYDERABAD_CENTER,
        zoom: 11,
        mapTypeId: 'roadmap' // Default map type
    });

    infoWindow = new google.maps.InfoWindow();
    directionsService = new google.maps.DirectionsService();
    directionsRenderer = new google.maps.DirectionsRenderer({ map: map });

    // Load data (in a real app, this would be an API call)
    projectsData = await fetchProjectsData();
    populateProjectDropdown();
    displayAllProjectMarkers();
}

// Global function to be called by Google Maps API script
window.initMap = initMap;

// Function to simulate fetching data
async function fetchProjectsData() {
    // In a real application, you'd fetch this from your backend:
    // const response = await fetch('/api/projects');
    // const data = await response.json();
    // return data;
        const response = await fetch('projects.json'); // Path to your JSON file
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
        }
    const data = await response.json();

    // For demonstration, use the conceptual JSON data:
    return data;
}

// Populate the project dropdown
function populateProjectDropdown() {
    const dropdown = document.getElementById('project-dropdown');
    projectsData.forEach(project => {
        const option = document.createElement('option');
        option.value = project.projectId;
        option.textContent = project.projectName;
        dropdown.appendChild(option);
    });

    dropdown.addEventListener('change', (event) => {
        const selectedProjectId = event.target.value;
        if (selectedProjectId) {
            displayProjectDetails(selectedProjectId);
        } else {
            // Hide project and site details, show all project markers
            document.getElementById('project-details').style.display = 'none';
            document.getElementById('site-details').style.display = 'none';
            directionsRenderer.setDirections({ routes: [] }); // Clear directions
            displayAllProjectMarkers();
            map.setCenter(HYDERABAD_CENTER);
            map.setZoom(11);
        }
    });
}

// Display markers for all projects
function displayAllProjectMarkers() {
    clearMarkers();
    projectsData.forEach(project => {
        const marker = new google.maps.Marker({
            position: project.projectLocation,
            map: map,
            title: project.projectName
        });
        marker.addListener('click', () => {
            infoWindow.setContent(`<h3>${project.projectName}</h3><p>Click to view details</p>`);
            infoWindow.open(map, marker);
            document.getElementById('project-dropdown').value = project.projectId;
            displayProjectDetails(project.projectId);
        });
        markers.push(marker);
    });
}

// Clear all markers from the map
function clearMarkers() {
    markers.forEach(marker => marker.setMap(null));
    markers = [];
}

// Display details for a selected project
function displayProjectDetails(projectId) {
    const project = projectsData.find(p => p.projectId === projectId);
    if (!project) return;

    // Clear previous details
    document.getElementById('site-details').style.display = 'none';
    directionsRenderer.setDirections({ routes: [] }); // Clear directions

    document.getElementById('project-name').textContent = project.projectName;

    // Project Images
    const projectImagesDiv = document.getElementById('project-images');
    projectImagesDiv.innerHTML = '';
    project.projectImages.forEach(src => {
        const img = document.createElement('img');
        img.src = src;
        img.alt = project.projectName;
        projectImagesDiv.appendChild(img);
    });

    let currentImageIndex = 0;
    const images = projectImagesDiv.querySelectorAll('img');

    function showImage(index) {
        images.forEach((img, i) => {
            img.classList.toggle('active', i === index);
        });
    }

    document.querySelector('.prev-btn').onclick = () => {
        currentImageIndex = (currentImageIndex > 0) ? currentImageIndex - 1 : images.length - 1;
        showImage(currentImageIndex);
    };

    document.querySelector('.next-btn').onclick = () => {
        currentImageIndex = (currentImageIndex < images.length - 1) ? currentImageIndex + 1 : 0;
        showImage(currentImageIndex);
    };

    showImage(currentImageIndex);

    // Project Key Points
    const projectKeyPointsList = document.getElementById('project-keypoints-list');
    projectKeyPointsList.innerHTML = '';
    project.projectKeyPoints.forEach(point => {
        const li = document.createElement('li');
        li.textContent = point;
        projectKeyPointsList.appendChild(li);
    });

    // Landmark Routes
    const landmarkRoutesContainer = document.getElementById('landmark-routes-container');
    landmarkRoutesContainer.innerHTML = '';
    if (project.famousLandmarksRoutes) {
        project.famousLandmarksRoutes.forEach(route => {
            const btn = document.createElement('button');
            btn.textContent = route.name;
            btn.classList.add('landmark-route-btn');
            btn.onclick = () => {
                // Find the first site to calculate the route to.
                if (project.sites && project.sites.length > 0) {
                    calculateAndDisplayRoute(route.location, project.sites[0].siteLocation);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }
            };
            landmarkRoutesContainer.appendChild(btn);
        });
    }

    // Populate Sites
    const siteListUl = document.getElementById('site-list');
    siteListUl.innerHTML = '';
    project.sites.forEach(site => {
        const li = document.createElement('li');
        li.textContent = site.siteName;
        li.dataset.siteId = site.siteId;
        li.addEventListener('click', () => {
            displaySiteDetails(project.projectId, site.siteId).catch(err => {
                console.error('Error displaying site details:', err);
                document.getElementById('site-source-msg').textContent = 'Error loading site details';
            });
        });
        siteListUl.appendChild(li);
    });

    document.getElementById('project-details').style.display = 'block';

    // Update map: zoom to project, clear previous markers and add site markers
    clearMarkers();
    const bounds = new google.maps.LatLngBounds();
    project.sites.forEach(site => {
        const marker = new google.maps.Marker({
            position: site.siteLocation,
            map: map,
            title: site.siteName,
            icon: {
                url: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png" // Different color for sites
            }
        });
        marker.addListener('click', () => {
            infoWindow.setContent(`<h3>${site.siteName}</h3><p>Click to view site details</p>`);
            infoWindow.open(map, marker);
            displaySiteDetails(project.projectId, site.siteId).catch(err => {
                console.error('Error displaying site details:', err);
                document.getElementById('site-source-msg').textContent = 'Error loading site details';
            });
        });
        markers.push(marker);
        bounds.extend(site.siteLocation);
    });
    map.fitBounds(bounds);
}

// Display details for a selected site
async function displaySiteDetails(projectId, siteId) {
    const project = projectsData.find(p => p.projectId === projectId);
    if (!project) return;
    const site = project.sites.find(s => s.siteId === siteId);
    if (!site) return;

    // Prevent any accidental plot modal from showing while we render the site
    suppressPlotModal = true;
    hidePlotModal();
    document.getElementById('site-name').textContent = site.siteName;
    document.getElementById('site-details').style.display = 'block';

    try {
        // Render Site Layout (using SVG for demonstration)
        const siteLayoutCanvas = document.getElementById('site-layout-canvas');
        siteLayoutCanvas.innerHTML = ''; // Clear previous layout

    // Create an SVG element
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    // Ensure a tooltip element exists for hover info
    ensurePlotTooltip();
    // Determine viewBox from site layout dimensions (fallback to previous defaults)
    const vbWidth = parseFloat(site.siteLayoutWidth) || 593.91998;
    const vbHeight = parseFloat(site.siteLayoutHeight) || 1047.04;
    svg.setAttribute("viewBox", `0 0 ${vbWidth} ${vbHeight}`); // Adjust viewBox based on your plot coordinates
    // Make the SVG fill the canvas so hit-testing aligns with visuals
    svg.setAttribute("width", "100%");
    svg.setAttribute("height", "100%");
    svg.style.display = 'block';
    siteLayoutCanvas.appendChild(svg);

    // Disable pointer events while we build the SVG to avoid accidental clicks
    svg.style.pointerEvents = 'none';

    // Add a base image if you want to show the roads/park under the clickable plots
    // This requires accurately overlaying the image under the SVG.
    // This is optional but can help visually.
    
    const img = document.createElementNS("http://www.w3.org/2000/svg", "image");
    img.setAttributeNS('http://www.w3.org/1999/xlink', 'href', site.siteLayout); // Adjust path
    img.setAttribute("x", "0");
    img.setAttribute("y", "0");
    img.setAttribute("width", site.siteLayoutWidth); // Match viewBox width
    img.setAttribute("height", site.siteLayoutHeight); // Match viewBox height
    svg.appendChild(img);

    


    // Load plots: site.plots may be an array or a filename (string to an Excel file)
    let plots = [];
    if (Array.isArray(site.plots)) {
        plots = site.plots;
    } else if (typeof site.plots === 'string' && site.plots.trim() !== '') {
        // Fetch and parse Excel/CSV/Google Sheet file (using xlsx library included in the page)
        try {
           // document.getElementById('site-source-msg').textContent = `Loading plots from ${site.plots}...`;
            plots = await loadPlotsFromExcel(site.plots);
            // Cache parsed plots on the site object so we don't re-fetch repeatedly
            site.plots = plots;
           // document.getElementById('site-source-msg').textContent = `Plot data loaded from ${site.plots}.`;
        } catch (err) {
            console.error('Failed to load plots:', err);
            // Helpful guidance when Google Sheets are not published/shared
            if (err.message && /403|401|Failed to fetch|Network error/.test(err.message)) {
                document.getElementById('site-source-msg').textContent = `Failed to load plots. If using Google Sheets, ensure the sheet is published or shared publicly (or use a CSV export URL).`;
            } else {
                document.getElementById('site-source-msg').textContent = `Failed to load plots: ${err.message}`;
            }
            plots = [];
        }
    } else if (typeof site.plots === 'object' && site.plots !== null && site.plots.googleSheet) {
        // Support site.plots being an object with googleSheet URL
        try {
            //document.getElementById('site-source-msg').textContent = `Loading plots from Google Sheet...`;
            plots = await loadPlotsFromExcel(site.plots.googleSheet);
            site.plots = plots;
            //document.getElementById('site-source-msg').textContent = `Plot data loaded from Google Sheet.`;
        } catch (err) {
            console.error('Failed to load plots from Google Sheet:', err);
            document.getElementById('site-source-msg').textContent = `Failed to load plots from Google Sheet: ${err.message}`;
            plots = [];
        }
    } else {
        plots = [];
    }

    plots.forEach(plot => {
        if (!plot.layoutCoordinates || plot.layoutCoordinates.toString().trim() === '') {
            console.warn(`Skipping plot ${plot.plotId || plot.plotName || 'unknown'}: missing layoutCoordinates`);
            return; // skip plots that don't have SVG path data
        }

        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute("d", plot.layoutCoordinates); // Use your plot's SVG path data
        path.setAttribute("stroke", "black");
        path.setAttribute("stroke-width", "1");
        // Normalize status to a safe CSS class name (lowercase, spaces -> hyphens)
        const statusClass = (plot.status || 'available').toString().toLowerCase().replace(/\s+/g, '-');
        path.classList.add(`plot-${statusClass}`); // Apply status-based color
        path.style.cursor = 'pointer';
        // Ensure the path can receive pointer events even if SVG had pointer-events toggled
        path.style.pointerEvents = 'auto';
        path.dataset.plotId = plot.plotId;

        // Add hover effect and tooltip
        path.addEventListener('mouseenter', (e) => {
            path.style.strokeWidth = "2"; // Thicker border on hover
            path.style.stroke = "black"; // Change border color
            const tt = document.getElementById('plot-tooltip');
            if (tt) {
                const status = (plot.status || '').toString().charAt(0).toUpperCase() + (plot.status || '').toString().slice(1);
                tt.classList.remove('hidden');
                positionTooltip(e, tt);
            }
        });
        path.addEventListener('mousemove', (e) => {
            const tt = document.getElementById('plot-tooltip');
            if (tt && !tt.classList.contains('hidden')) positionTooltip(e, tt);
        });
        path.addEventListener('mouseleave', () => {
            path.style.strokeWidth = "0.5";
            path.style.stroke = "black";
            const tt = document.getElementById('plot-tooltip');
            if (tt) tt.classList.add('hidden');
        });

        path.addEventListener('click', (e) => {
            // Only respond to primary button clicks
            if (e.button !== 0) return;
            displayPlotDetails(plot);
        });
        svg.appendChild(path);

        const bbox = path.getBBox();
        if (bbox.width > 10 && bbox.height > 10) { // Only add label if the plot is visible
            const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
            text.setAttribute("x", bbox.x + bbox.width / 2);
            text.setAttribute("y", bbox.y + bbox.height / 2 + 3);
            text.setAttribute("text-anchor", "middle");
            text.setAttribute("font-size", "10");
            text.textContent = plot.plotName;
            text.style.pointerEvents = "none";
            svg.appendChild(text);
        }
    });

    // Clear existing route directions
    directionsRenderer.setDirections({ routes: [] });

    // Display route maps from famous places
    if (site.famousLandmarksRoutes && site.famousLandmarksRoutes.length > 0) {
        site.famousLandmarksRoutes.forEach(landmark => {
            calculateAndDisplayRoute(landmark.location, site.siteLocation);
        });
    }

        // Adjust map view to the site
        map.setCenter(site.siteLocation);
        map.setZoom(15);
    } finally {
        // Allow plot modal to appear again after rendering completes.
        // Use a short delay to avoid accidental popup triggers during DOM updates and
        // re-enable pointer events on the SVG so plots become clickable.
        setTimeout(() => {
            suppressPlotModal = false;
            try {
                if (svg && svg.style) svg.style.pointerEvents = 'auto';
            } catch (e) {
                // ignore
            }
        }, 250);
    }
}

// Display details for a selected plot
function displayPlotDetails(plot) {
    if (suppressPlotModal) return; // don't show modal while site is being loaded/rendered
    // Populate modal content with plot data and show centered popup
    const keyFeaturesArr = Array.isArray(plot.keyFeatures) ? plot.keyFeatures : (plot.keyFeatures ? plot.keyFeatures.toString().split(',').map(s => s.trim()).filter(Boolean) : []);
    document.getElementById('modal-plot-name').textContent = plot.plotName || plot.plotId || 'Plot Details';
    document.getElementById('modal-plot-area').textContent = plot.area || '';
    document.getElementById('modal-plot-direction').textContent = plot.direction || '';
    document.getElementById('modal-plot-keyfeatures').textContent = keyFeaturesArr.join(', ') || 'N/A';
    document.getElementById('modal-plot-status').textContent = (plot.status || '').toString().charAt(0).toUpperCase() + (plot.status || '').toString().slice(1);

    // Show modal overlay
    const overlay = document.getElementById('modal-overlay');
    // Hide any tooltip when modal is shown
    const tt = document.getElementById('plot-tooltip'); if (tt) tt.classList.add('hidden');
    if (overlay) overlay.classList.remove('hidden');
}

// Create tooltip element if not present
function ensurePlotTooltip() {
    if (!document.getElementById('plot-tooltip')) {
        const t = document.createElement('div');
        t.id = 'plot-tooltip';
        t.className = 'hidden';
        document.body.appendChild(t);
    }
}

// Position tooltip near cursor, avoiding viewport overflow
function positionTooltip(e, tt) {
    const offsetX = 12, offsetY = 12;
    // Use pageX/Y when available, fallback to clientX/Y
    const x = e.pageX || (e.clientX + window.scrollX);
    const y = e.pageY || (e.clientY + window.scrollY);
    // initial placement
    let left = x + offsetX;
    let top = y + offsetY;
    // Temporarily set position to calculate size
    tt.style.left = left + 'px';
    tt.style.top = top + 'px';
    tt.style.display = 'block';
    const rect = tt.getBoundingClientRect();
    // Adjust if overflowing right/bottom
    if (rect.right > window.innerWidth) {
        left = Math.max(8, x - rect.width - offsetX);
    }
    if (rect.bottom > window.innerHeight) {
        top = Math.max(8, y - rect.height - offsetY);
    }
    tt.style.left = left + 'px';
    tt.style.top = top + 'px';
}

// Load plot rows from an Excel file and map to plot objects
async function loadPlotsFromExcel(url) {
    // If this is a Google Sheets URL, convert to a CSV export URL
    const gsCsv = convertGoogleSheetUrlToCsv(url);
    if (gsCsv) {
        url = gsCsv;
        //document.getElementById('site-source-msg').textContent = `Loading plots from Google Sheet...`;
    }

    // Try fetching the file. If .xlsx isn't present, try .csv as a fallback.
    let res;
    try {
        res = await fetch(url);
    } catch (fetchErr) {
        throw new Error(`Network error fetching ${url}: ${fetchErr.message}`);
    }
    if (!res.ok) {
        // Try replacing .xlsx with .csv if applicable
        if (url.toLowerCase().endsWith('.xlsx')) {
            const csvUrl = url.replace(/\.xlsx$/i, '.csv');
            res = await fetch(csvUrl);
            if (res.ok) url = csvUrl; // use csvUrl going forward
        }
    }

    if (!res.ok) throw new Error(`Failed to fetch ${url} (status ${res.status})`);

    const contentType = res.headers.get('content-type') || '';
    let raw = [];

    if (contentType.includes('text/csv') || url.toLowerCase().endsWith('.csv')) {
        // Parse CSV using XLSX so we handle quoted fields and commas inside values correctly
        const text = await res.text();
        const workbook = XLSX.read(text, { type: 'string' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        raw = XLSX.utils.sheet_to_json(sheet, { defval: '' });
    } else {
        // Parse Excel (.xlsx/.xls)
        const arrayBuffer = await res.arrayBuffer();
        const data = new Uint8Array(arrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        raw = XLSX.utils.sheet_to_json(sheet, { defval: '' });
    }

    const getFirst = (row, candidates) => {
        for (const c of candidates) {
            if (c in row && row[c] !== '') return row[c];
        }
        return '';
    };

    return raw.map(row => {
        const plotId = getFirst(row, ['PlotId', 'plotId', 'Plot ID', 'Plot', 'ID', 'plot_id']) || '';
        const plotName = getFirst(row, ['PlotName', 'plotName', 'Plot Name', 'Name']) || plotId || '';
        const layoutCoordinates = getFirst(row, ['LayoutCoordinates', 'layoutCoordinates', 'SVG Path', 'Path', 'layout', 'L']) || '';
        const area = getFirst(row, ['Area', 'area', 'Sq Ft', 'Area (sq ft)']) || '';
        const direction = getFirst(row, ['Direction', 'direction']) || '';
        const kf = getFirst(row, ['KeyFeatures', 'Key Features', 'keyFeatures', 'Key_Features']) || '';
        let keyFeatures = [];
        if (kf) {
            const s = kf.toString().trim();
            if ((s.startsWith('[') && s.endsWith(']')) || (s.startsWith('"') && s.endsWith('"'))) {
                try {
                    const parsed = JSON.parse(s);
                    if (Array.isArray(parsed)) keyFeatures = parsed.map(x => x.toString().trim()).filter(Boolean);
                    else if (typeof parsed === 'string') keyFeatures = parsed.split(',').map(x => x.toString().trim()).filter(Boolean);
                } catch (e) {
                    keyFeatures = s.replace(/^[\[\]"]+|[\[\]"]+$/g, '').split(',').map(x => x.trim()).filter(Boolean);
                }
            } else {
                keyFeatures = s.split(',').map(x => x.trim()).filter(Boolean);
            }
        }
        const status = (getFirst(row, ['Status', 'status']) || 'available').toString();

        return { plotId, plotName, layoutCoordinates, area, direction, keyFeatures, status };
    });
}

// Detect Google Sheets URLs and convert them to a CSV export URL that can be fetched
function convertGoogleSheetUrlToCsv(url) {
    if (!url || typeof url !== 'string') return null;
    const u = url.trim();

    // Already an export csv URL
    if (u.includes('export?format=csv') || u.includes('output=csv')) return u;

    // Pattern: https://docs.google.com/spreadsheets/d/<SPREADSHEET_ID>/edit#gid=<GID>
    let m = u.match(/docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9-_]+)(?:\/.*)?(?:#gid=(\d+))?/);
    if (m) {
        const id = m[1];
        const gid = m[2] || '0';
        return `https://docs.google.com/spreadsheets/d/${id}/export?format=csv&gid=${gid}`;
    }

    // Pattern: published URL: https://docs.google.com/spreadsheets/d/e/<ID>/pubhtml?gid=0&single=true
    m = u.match(/docs\.google\.com\/spreadsheets\/d\/e\/([a-zA-Z0-9-_]+)\/pubhtml(?:.*?gid=(\d+))?/);
    if (m) {
        const id = m[1];
        const gid = m[2] || '0';
        return `https://docs.google.com/spreadsheets/d/e/${id}/pub?gid=${gid}&single=true&output=csv`;
    }

    return null;
}

// Calculate and display route on map
function calculateAndDisplayRoute(origin, destination) {
    directionsService.route({
        origin: origin,
        destination: destination,
        travelMode: google.maps.TravelMode.DRIVING
    }, (response, status) => {
        if (status === 'OK') {
            directionsRenderer.setDirections(response);
        } else {
            window.alert('Directions request failed due to ' + status);
        }
    });
}

// Hide the plot modal
function hidePlotModal() {
    const overlay = document.getElementById('modal-overlay');
    
    if (overlay) overlay.classList.add('hidden');
}

// Modal bindings: close button, overlay click (outside modal), Escape key
(function setupModalBindings(){
    // Bind immediately — script runs after DOM is loaded in our page
    const closeBtn = document.getElementById('modal-close-btn');
    if (closeBtn) closeBtn.addEventListener('click', hidePlotModal);

    const overlay = document.getElementById('modal-overlay');
    if (overlay) {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) hidePlotModal();
        });
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') hidePlotModal();
    });
})();

