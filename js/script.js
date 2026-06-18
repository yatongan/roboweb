// Navigation active state on scroll
window.addEventListener('scroll', () => {
    const sections = document.querySelectorAll('section');
    const navLinks = document.querySelectorAll('.nav-menu a');
    
    let current = '';
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
        if (scrollY >= (sectionTop - 200)) {
            current = section.getAttribute('id');
        }
    });
});

// 3D Viewer for Services Page
function init3DViewer() {
    const container = document.getElementById('3d-viewer');
    if (!container) {
        console.warn('3D viewer container not found');
        return;
    }

    if (!window.THREE) {
        console.error('Three.js not loaded');
        return;
    }

    console.log('Initializing 3D viewer...');
    
    // Force container to have dimensions
    let width = container.clientWidth;
    let height = container.clientHeight;
    
    console.log('Container dimensions:', width, height);
    
    // Fallback to CSS dimensions if not yet calculated
    if (width === 0) width = 300;
    if (height === 0) height = 300;
    
    console.log('Adjusted dimensions:', width, height);
    
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a2e);
    
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.z = 1.8;  // Moved closer to object
    
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, precision: 'highp' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio || 1);
    renderer.setClearColor(0x1a1a2e, 1);
    
    // Clear the container and append renderer
    while (container.firstChild) {
        container.removeChild(container.firstChild);
    }
    container.appendChild(renderer.domElement);

    console.log('Renderer created and appended');

    // Lighting - ensure good visibility
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
    directionalLight.position.set(5, 5, 7);
    scene.add(directionalLight);
    
    const pointLight = new THREE.PointLight(0x00a3e0, 1.0);
    pointLight.position.set(-5, 3, 5);
    scene.add(pointLight);

    console.log('Lights added to scene');

    // Create a reconstructed object (composite of geometric shapes)
    const group = new THREE.Group();
    
    // Base mesh
    const baseGeometry = new THREE.IcosahedronGeometry(0.6, 4);
    const baseMaterial = new THREE.MeshPhongMaterial({
        color: 0x0066cc,
        shininess: 100,
        wireframe: false,
        emissive: 0x001a4d
    });
    const baseMesh = new THREE.Mesh(baseGeometry, baseMaterial);
    group.add(baseMesh);
    
    // Add some detail meshes
    const detailGeometry = new THREE.TetrahedronGeometry(0.25, 2);
    const detailMaterial = new THREE.MeshPhongMaterial({
        color: 0x00a3e0,
        shininess: 80,
        emissive: 0x004466
    });
    
    const detail1 = new THREE.Mesh(detailGeometry, detailMaterial);
    detail1.position.set(0.5, 0.5, 0.5);
    group.add(detail1);
    
    const detail2 = new THREE.Mesh(detailGeometry, detailMaterial);
    detail2.position.set(-0.5, -0.4, 0.5);
    detail2.scale.set(0.8, 0.8, 0.8);
    group.add(detail2);
    
    // Add wireframe overlay for technical look
    const wireframeGeometry = new THREE.IcosahedronGeometry(0.62, 4);
    const wireframeMaterial = new THREE.MeshPhongMaterial({
        color: 0x00d4ff,
        wireframe: true,
        opacity: 0.4,
        transparent: true,
        emissive: 0x006688
    });
    const wireframe = new THREE.Mesh(wireframeGeometry, wireframeMaterial);
    group.add(wireframe);
    
    scene.add(group);

    console.log('3D objects created and added to scene');

    // Rotation state
    let mouseDown = false;
    let mouseX = 0;
    let mouseY = 0;
    let targetRotationX = 0;
    let targetRotationY = 0;

    // Mouse controls
    renderer.domElement.addEventListener('mousedown', (e) => {
        mouseDown = true;
        mouseX = e.clientX;
        mouseY = e.clientY;
    });

    renderer.domElement.addEventListener('mousemove', (e) => {
        if (mouseDown) {
            const deltaX = e.clientX - mouseX;
            const deltaY = e.clientY - mouseY;
            
            targetRotationY += deltaX * 0.01;
            targetRotationX += deltaY * 0.01;
            
            mouseX = e.clientX;
            mouseY = e.clientY;
        }
    });

    renderer.domElement.addEventListener('mouseup', () => {
        mouseDown = false;
    });

    renderer.domElement.addEventListener('mouseleave', () => {
        mouseDown = false;
    });

    // Touch controls
    let touchStartX = 0;
    let touchStartY = 0;

    renderer.domElement.addEventListener('touchstart', (e) => {
        if (e.touches.length > 0) {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
        }
    });

    renderer.domElement.addEventListener('touchmove', (e) => {
        e.preventDefault();
        if (e.touches.length > 0) {
            const deltaX = e.touches[0].clientX - touchStartX;
            const deltaY = e.touches[0].clientY - touchStartY;
            
            targetRotationY += deltaX * 0.01;
            targetRotationX += deltaY * 0.01;
            
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
        }
    }, { passive: false });

    // Zoom controls
    renderer.domElement.addEventListener('wheel', (e) => {
        e.preventDefault();
        
        if (e.deltaY > 0) {
            camera.position.z *= 1.1;
        } else {
            camera.position.z *= 0.9;
        }
        
        // Limit zoom
        camera.position.z = Math.max(0.5, Math.min(5, camera.position.z));
    }, { passive: false });

    // Handle window resize
    function onWindowResize() {
        const newWidth = container.clientWidth || 300;
        const newHeight = container.clientHeight || 300;
        
        if (newWidth > 0 && newHeight > 0) {
            camera.aspect = newWidth / newHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(newWidth, newHeight);
        }
    }

    window.addEventListener('resize', onWindowResize);

    // Animation loop
    function animate() {
        requestAnimationFrame(animate);
        
        // Smooth rotation with easing
        group.rotation.x += (targetRotationX - group.rotation.x) * 0.1;
        group.rotation.y += (targetRotationY - group.rotation.y) * 0.1;
        
        // Auto-rotate if not being dragged (for demo purposes)
        if (!mouseDown) {
            targetRotationY += 0.001;
        }
        
        renderer.render(scene, camera);
    }

    console.log('Starting animation loop...');
    animate();
}

// Initialize 3D viewer when page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init3DViewer);
} else {
    init3DViewer();
}

// Form submission
const contactForm = document.getElementById('contactForm');
if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // Get form data
        const formData = new FormData(contactForm);
        const data = Object.fromEntries(formData);
        
        // Here you would normally send this to a backend service
        console.log('Form submitted:', data);
        
        // Show success message
        alert('Thank you for your inquiry! We will contact you shortly.');
        contactForm.reset();
    });
}

// Smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (href !== '#') {
            e.preventDefault();
            const target = document.querySelector(href);
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        }
    });
});

// Mobile menu toggle (if needed for smaller screens)
function setupMobileMenu() {
    const navMenu = document.querySelector('.nav-menu');
    const navContainer = document.querySelector('.nav-container');
    
    // Create hamburger menu for mobile
    if (window.innerWidth < 768) {
        if (!document.querySelector('.hamburger')) {
            const hamburger = document.createElement('div');
            hamburger.className = 'hamburger';
            hamburger.innerHTML = '<i class="fas fa-bars"></i>';
            navContainer.appendChild(hamburger);
        }
    }
}

// Call on load and resize
window.addEventListener('load', setupMobileMenu);
window.addEventListener('resize', setupMobileMenu);

// Add animation to elements on scroll
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe service cards and other elements
document.querySelectorAll('.service-card, .app-card, .feature-item, .team-member').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'all 0.5s ease';
    observer.observe(el);
});

// Smooth page transitions
document.addEventListener('DOMContentLoaded', () => {
    document.body.style.opacity = '1';
});

// Add active class to navigation based on current page
function setActiveNav() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-menu a').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === currentPage || 
            (currentPage === '' && link.getAttribute('href') === 'index.html')) {
            link.classList.add('active');
        }
    });
}

window.addEventListener('load', setActiveNav);

// Increment counter animation (for statistics)
function animateCounters() {
    const counters = document.querySelectorAll('[data-count]');
    
    counters.forEach(counter => {
        const target = parseInt(counter.getAttribute('data-count'));
        const increment = target / 100;
        let current = 0;
        
        const updateCounter = () => {
            if (current < target) {
                current += increment;
                counter.textContent = Math.ceil(current);
                setTimeout(updateCounter, 20);
            } else {
                counter.textContent = target;
            }
        };
        
        updateCounter();
    });
}

// Call animation when stats section is visible
const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting && !entry.target.classList.contains('animated')) {
            animateCounters();
            entry.target.classList.add('animated');
        }
    });
});

// Observe stats section if it exists
const statsSection = document.querySelector('[style*="statistics"]');
if (statsSection) {
    statsObserver.observe(statsSection);
}
