let map;
let projectsData = []; // This will hold your JSON data
let markers = [];
let infoWindow;
let directionsService;
let directionsRenderer;

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
        li.addEventListener('click', () => displaySiteDetails(project.projectId, site.siteId));
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
            displaySiteDetails(project.projectId, site.siteId);
        });
        markers.push(marker);
        bounds.extend(site.siteLocation);
    });
    map.fitBounds(bounds);
}

// Display details for a selected site
function displaySiteDetails(projectId, siteId) {
    const project = projectsData.find(p => p.projectId === projectId);
    if (!project) return;
    const site = project.sites.find(s => s.siteId === siteId);
    if (!site) return;

    document.getElementById('site-name').textContent = site.siteName;
    document.getElementById('site-details').style.display = 'block';
    document.getElementById('plot-details').style.display = 'none'; // Hide plot details initially

    // Render Site Layout (using SVG for demonstration)
    const siteLayoutCanvas = document.getElementById('site-layout-canvas');
    siteLayoutCanvas.innerHTML = ''; // Clear previous layout

    // Create an SVG element
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    //svg.setAttribute("width", "100%");
    //svg.setAttribute("height", "100%");
    svg.setAttribute("viewBox", "0 0 593.91998 1047.04"); // Adjust viewBox based on your plot coordinates
    siteLayoutCanvas.appendChild(svg);

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
    
    


    site.plots.forEach(plot => {
        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute("d", plot.layoutCoordinates); // Use your plot's SVG path data
        path.setAttribute("stroke", "black");
        path.setAttribute("stroke-width", "1");
        path.classList.add(`plot-${plot.status}`); // Apply status-based color
        path.style.cursor = 'pointer';
        path.dataset.plotId = plot.plotId;

        // Add hover effect
        path.addEventListener('mouseenter', () => {
            path.style.strokeWidth = "2"; // Thicker border on hover
            path.style.stroke = "black"; // Change border color
        });
        path.addEventListener('mouseleave', () => {
            path.style.strokeWidth = "0.5";
            path.style.stroke = "black";
        });

        path.addEventListener('click', () => displayPlotDetails(plot));
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
}

// Display details for a selected plot
function displayPlotDetails(plot) {
    document.getElementById('plot-area').textContent = plot.area;
    document.getElementById('plot-direction').textContent = plot.direction;
    document.getElementById('plot-keyfeatures').textContent = plot.keyFeatures.join(', ') || 'N/A';
    document.getElementById('plot-status').textContent = plot.status.charAt(0).toUpperCase() + plot.status.slice(1);
    document.getElementById('plot-details').style.display = 'block';
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

// Global function to be called by Google Maps API script
window.initMap = initMap;