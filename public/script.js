// Portfolio Interactive Features

// Generate Skills Grid with Random Order
(function generateSkillsGrid() {
    // Icon source configurations
    const iconSources = {
        selfhst: 'https://cdn.jsdelivr.net/gh/selfhst/icons/svg/',
        simpleicons: 'https://cdn.simpleicons.org/',
        // Add more sources here as needed
    };

    const skills = [
        { name: 'AWS', icon: 'amazon-web-services-light.svg', source: 'selfhst' },
        { name: 'Azure', icon: 'microsoft-azure.svg', source: 'selfhst' },
        { name: 'Kubernetes', icon: 'kubernetes.svg', source: 'selfhst' },
        { name: 'Docker', icon: 'docker.svg', source: 'selfhst' },
        { name: 'VMware', icon: 'vmware-esx.svg', source: 'selfhst' },
        { name: 'Terraform', icon: 'hashicorp-terraform.svg', source: 'selfhst' },
        { name: 'Ansible', icon: 'ansible.svg', source: 'selfhst' },
        { name: 'GitLab', icon: 'gitlab.svg', source: 'selfhst' },
        { name: 'GitHub', icon: 'github-light.svg', source: 'selfhst' },
        { name: 'ArgoCD', icon: 'argo-cd.svg', source: 'selfhst' },
        { name: 'Keycloak', icon: 'keycloak.svg', source: 'selfhst' },
        { name: 'Gitea', icon: 'gitea.svg', source: 'selfhst' },
        { name: 'Jenkins', icon: 'jenkins.svg', source: 'selfhst' },
        { name: 'Prometheus', icon: 'prometheus.svg', source: 'selfhst' },
        { name: 'Grafana', icon: 'grafana.svg', source: 'selfhst' },
        { name: 'Loki', icon: 'loki.svg', source: 'selfhst' },
        { name: 'Nginx', icon: 'nginx.svg', source: 'selfhst' },
        { name: 'Cloudflare', icon: 'cloudflare.svg', source: 'selfhst' },
        { name: 'Proxmox', icon: 'proxmox.svg', source: 'selfhst' },
        { name: 'Python', icon: 'python.svg', source: 'selfhst' },
        { name: 'Java', icon: 'java.svg', source: 'selfhst' },
        { name: 'OPNsense', icon: 'opnsense.svg', source: 'selfhst' },
        { name: 'Git', icon: 'git.svg', source: 'selfhst' },
        { name: 'Linux', icon: 'linux.svg', source: 'selfhst' },
        { name: 'Helm', icon: 'helm-light.svg', source: 'selfhst' },
        { name: 'K3s', icon: 'rancher-k3s.svg', source: 'selfhst' },
        { name: 'RKE', icon: 'rancher-rke.svg', source: 'selfhst' },
        { name: 'MinIO', icon: 'minio-light.svg', source: 'selfhst' },
        { name: 'Harvester', icon: 'rancher-harvester.svg', source: 'selfhst' },

        // Simple Icons examples (uncomment and modify as needed):
        { name: 'OpenShift', icon: 'redhatopenshift', source: 'simpleicons' },
        { name: 'RedHat', icon: 'redhat', source: 'simpleicons' },
        // { name: 'PostgreSQL', icon: 'postgresql', source: 'simpleicons' },
    ];

    // Fisher-Yates shuffle algorithm
    function shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    // Rotate array by n positions
    function rotateArray(array, positions) {
        const n = positions % array.length;
        return array.slice(n).concat(array.slice(0, n));
    }

    // Get full icon URL based on source
    function getIconUrl(skill) {
        const baseUrl = iconSources[skill.source] || iconSources.selfhst;
        return `${baseUrl}${skill.icon}`;
    }

    // Create skill icon HTML
    function createSkillIcon(skill) {
        const iconUrl = getIconUrl(skill);
        return `
            <div class="skill-icon-box" data-skill="${skill.name}">
                <img src="${iconUrl}" alt="${skill.name}" loading="lazy">
                <span class="skill-name">${skill.name}</span>
            </div>
        `;
    }

    // Generate 4 rows with all skills in random order
    const skillsGrid = document.getElementById('skills-icon-grid');
    const numRows = 4;

    // Create one base shuffled array
    const baseShuffled = shuffleArray(skills);

    // Calculate offset to ensure good distribution
    const offsetPerRow = Math.floor(skills.length / numRows);

    for (let i = 0; i < numRows; i++) {
        const row = document.createElement('div');
        const direction = i % 2 === 0 ? 'row-right' : 'row-left';
        row.className = `skills-row ${direction}`;

        // Rotate the base array by a different amount for each row
        // Also add a small random offset to introduce variation
        const baseOffset = offsetPerRow * i;
        const randomOffset = Math.floor(Math.random() * 3); // 0-2 random offset
        const totalOffset = baseOffset + randomOffset;

        const rowSkills = rotateArray(baseShuffled, totalOffset);

        // Duplicate skills 3 times for seamless looping
        const skillsHTML = rowSkills.concat(rowSkills, rowSkills)
            .map(skill => createSkillIcon(skill))
            .join('');

        row.innerHTML = skillsHTML;
        skillsGrid.appendChild(row);
    }
})();

// Mobile Navigation Toggle
const navToggle = document.querySelector('.nav-toggle');
const navMenu = document.querySelector('.nav-menu');
const navLinks = document.querySelectorAll('.nav-link');

navToggle.addEventListener('click', () => {
    navMenu.classList.toggle('active');
    navToggle.classList.toggle('active');
});

// Close mobile menu when clicking a link
navLinks.forEach(link => {
    link.addEventListener('click', () => {
        navMenu.classList.remove('active');
        navToggle.classList.remove('active');
    });
});

// Smooth Scroll for Navigation Links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            const navHeight = document.querySelector('.nav').offsetHeight;
            const targetPosition = target.offsetTop - navHeight;

            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
        }
    });
});

// Scroll Animation Observer
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
        }
    });
}, observerOptions);

// Observe elements for animation
const animatedElements = document.querySelectorAll(
    '.section-title, .section-content, .skills-icon-grid, .projects-grid, .timeline, .cert-grid, .contact-content'
);

animatedElements.forEach(element => {
    observer.observe(element);
});

// Active Navigation Link on Scroll
const sections = document.querySelectorAll('section[id]');

const updateActiveNav = () => {
    const scrollY = window.pageYOffset;

    sections.forEach(section => {
        const sectionHeight = section.offsetHeight;
        const sectionTop = section.offsetTop - 100;
        const sectionId = section.getAttribute('id');

        if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
            navLinks.forEach(link => {
                link.classList.remove('active-link');
                if (link.getAttribute('href') === `#${sectionId}`) {
                    link.classList.add('active-link');
                }
            });
        }
    });
};

window.addEventListener('scroll', updateActiveNav);

// Navbar Background on Scroll
const nav = document.querySelector('.nav');
let lastScroll = 0;

window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;

    if (currentScroll > 100) {
        nav.style.boxShadow = '0 2px 20px rgba(0, 255, 65, 0.1)';
    } else {
        nav.style.boxShadow = 'none';
    }

    lastScroll = currentScroll;
});

// Terminal Typing Effect for Hero (Optional Enhancement)
const terminalText = document.querySelector('.hero-title');
if (terminalText) {
    const text = terminalText.textContent;
    terminalText.textContent = '';
    terminalText.style.opacity = '1';

    let index = 0;
    const typeWriter = () => {
        if (index < text.length) {
            terminalText.textContent += text.charAt(index);
            index++;
            setTimeout(typeWriter, 50);
        }
    };

    // Start typing effect after page loads
    setTimeout(typeWriter, 500);
}

// Add static prompt to terminal
const style = document.createElement('style');
style.textContent = `
    .active-link {
        color: var(--text-primary) !important;
        position: relative;
    }

    .active-link::before {
        content: '> ';
        color: var(--text-secondary);
    }
`;
document.head.appendChild(style);

// Performance: Throttle scroll events
let ticking = false;
window.addEventListener('scroll', () => {
    if (!ticking) {
        window.requestAnimationFrame(() => {
            updateActiveNav();
            ticking = false;
        });
        ticking = true;
    }
});

// Easter egg: Console message
console.log('%c> Hello fellow developer!', 'color: #00ff41; font-size: 14px; font-family: monospace;');
console.log('%c> Feel free to check out the source code', 'color: #00d9ff; font-size: 12px; font-family: monospace;');
console.log('%c> Built with vanilla HTML, CSS, and JavaScript', 'color: #8b92b5; font-size: 12px; font-family: monospace;');

// Prevent flash of unstyled content
document.addEventListener('DOMContentLoaded', () => {
    document.body.style.visibility = 'visible';
});

// Interactive Terminal
const interactiveTerminal = document.getElementById('interactive-terminal');
const terminalBackdrop = document.getElementById('terminal-backdrop');
const terminalToggle = document.getElementById('terminal-toggle');
const terminalInput = document.getElementById('terminal-input');
const terminalOutput = document.getElementById('terminal-output');
const terminalClose = document.querySelector('.terminal-close');

let commandHistory = [];
let historyIndex = -1;

// Available sections for terminal navigation
const terminalSections = {
    'about': { id: 'about', name: 'About' },
    'skills': { id: 'skills', name: 'Skills' },
    'projects': { id: 'projects', name: 'Projects' },
    'experience': { id: 'experience', name: 'Experience' },
    'certifications': { id: 'certifications', name: 'Certifications' },
    'contact': { id: 'contact', name: 'Contact' }
};

// Toggle terminal visibility
function toggleTerminal() {
    interactiveTerminal.classList.toggle('hidden');
    terminalBackdrop.classList.toggle('hidden');
    terminalToggle.classList.toggle('active');

    if (!interactiveTerminal.classList.contains('hidden')) {
        terminalInput.focus();
    }
}

terminalToggle.addEventListener('click', toggleTerminal);
terminalClose.addEventListener('click', toggleTerminal);
terminalBackdrop.addEventListener('click', toggleTerminal);

// Add output to terminal
function addOutput(text, className = '') {
    const line = document.createElement('p');
    line.className = `terminal-line ${className}`;
    line.textContent = text;
    terminalOutput.appendChild(line);
    terminalOutput.scrollTop = terminalOutput.scrollHeight;
}

// Clear terminal
function clearTerminal() {
    terminalOutput.innerHTML = '';
}

// Navigate to section
function navigateToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        const navHeight = document.querySelector('.nav').offsetHeight;
        const targetPosition = section.offsetTop - navHeight;

        window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
        });

        // Close terminal after navigation
        setTimeout(() => {
            toggleTerminal();
        }, 300);

        return true;
    }
    return false;
}

// Process command
function processCommand(command) {
    const cmd = command.trim().toLowerCase();
    const args = cmd.split(' ');
    const mainCmd = args[0];

    // Add command to output
    addOutput(`> ${command}`, 'command');

    // Add to history
    if (command.trim()) {
        commandHistory.push(command);
        historyIndex = commandHistory.length;
    }

    switch (mainCmd) {
        case 'help':
            addOutput('Available commands:', 'success');
            addOutput('');
            addOutput('Navigation:');
            addOutput('  help              - Show this help message');
            addOutput('  ls                - List available sections');
            addOutput('  cd <section>      - Navigate to a section');
            addOutput('  clear             - Clear terminal');
            addOutput('  whoami            - Display information about me');
            addOutput('');
            addOutput('DevOps Tools:');
            addOutput('  kubectl           - Kubernetes cluster management');
            addOutput('  docker            - Container operations');
            addOutput('  terraform         - Infrastructure as Code');
            addOutput('  ansible           - Configuration management');
            addOutput('  git               - Version control & GitOps');
            addOutput('  argocd            - GitOps deployment tool');
            addOutput('  prometheus        - Monitoring & alerting');
            addOutput('  aws               - AWS cloud services');
            addOutput('');
            addOutput('Available sections:');
            Object.keys(terminalSections).forEach(key => {
                addOutput(`  ${key.padEnd(15)} - ${terminalSections[key].name}`);
            });
            break;

        case 'ls':
            addOutput('Available sections:', 'success');
            Object.keys(terminalSections).forEach(key => {
                addOutput(`  ${key}/`);
            });
            break;

        case 'cd':
            if (args.length < 2) {
                addOutput('Usage: cd <section>', 'error');
                addOutput('Try "ls" to see available sections');
            } else {
                const sectionName = args[1].toLowerCase();
                if (terminalSections[sectionName]) {
                    addOutput(`Navigating to ${terminalSections[sectionName].name}...`, 'success');
                    navigateToSection(terminalSections[sectionName].id);
                } else {
                    addOutput(`Error: Section "${sectionName}" not found`, 'error');
                    addOutput('Try "ls" to see available sections');
                }
            }
            break;

        case 'clear':
            clearTerminal();
            break;

        case 'whoami':
            addOutput('Muhammad Aiman Bin Zaidi', 'success');
            addOutput('Senior IT Infrastructure Engineer');
            addOutput('DevOps & Cloud Specialist');
            addOutput('4+ years experience in cloud infrastructure');
            break;

        case 'kubectl':
            if (args[1] === 'get' && args[2] === 'pods') {
                addOutput('NAME                                READY   STATUS    RESTARTS   AGE', 'success');
                addOutput('argocd-server-7b9c5d6f8-xk2p9      1/1     Running   0          45d');
                addOutput('grafana-5d8f7c9b4-mq7h3            1/1     Running   0          45d');
                addOutput('prometheus-0                        1/1     Running   0          45d');
                addOutput('loki-0                              1/1     Running   0          45d');
            } else if (args[1] === 'get' && args[2] === 'nodes') {
                addOutput('NAME           STATUS   ROLES           AGE    VERSION', 'success');
                addOutput('k3s-master     Ready    control-plane   120d   v1.28.3+k3s1');
                addOutput('k3s-worker-1   Ready    <none>          120d   v1.28.3+k3s1');
                addOutput('k3s-worker-2   Ready    <none>          120d   v1.28.3+k3s1');
            } else {
                addOutput('Kubernetes expertise:', 'success');
                addOutput('  ✓ K3s cluster management');
                addOutput('  ✓ ArgoCD for GitOps deployments');
                addOutput('  ✓ Certified Kubernetes Administrator (CKA)');
                addOutput('Try: kubectl get pods | kubectl get nodes');
            }
            break;

        case 'docker':
            if (args[1] === 'ps') {
                addOutput('CONTAINER ID   IMAGE                    STATUS         PORTS', 'success');
                addOutput('a3f5e892b1c4   gitlab-ee:latest         Up 2 months    0.0.0.0:443->443/tcp');
                addOutput('b7d8c4f3e2a1   registry:2               Up 2 months    0.0.0.0:5000->5000/tcp');
                addOutput('c9e1d5a8f4b2   nginx:alpine             Up 3 weeks     0.0.0.0:80->80/tcp');
            } else {
                addOutput('Container expertise:', 'success');
                addOutput('  ✓ Docker containerization');
                addOutput('  ✓ Self-hosted GitLab with Docker');
                addOutput('  ✓ Multi-container orchestration');
                addOutput('Try: docker ps');
            }
            break;

        case 'terraform':
            if (args[1] === 'plan') {
                addOutput('Terraform will perform the following actions:', 'success');
                addOutput('');
                addOutput('  # module.aws_infrastructure.aws_instance.app_server will be created');
                addOutput('  + resource "aws_instance" "app_server" {');
                addOutput('      + ami           = "ami-0c55b159cbfafe1f0"');
                addOutput('      + instance_type = "t3.medium"');
                addOutput('    }');
                addOutput('');
                addOutput('Plan: 12 to add, 0 to change, 0 to destroy.');
            } else {
                addOutput('Infrastructure as Code (IaC) expertise:', 'success');
                addOutput('  ✓ Terraform for AWS & Azure provisioning');
                addOutput('  ✓ Automated infrastructure deployment');
                addOutput('  ✓ State management & modules');
                addOutput('Try: terraform plan');
            }
            break;

        case 'ansible':
            if (args[1] === 'playbook') {
                addOutput('PLAY [Red Hat Linux Patching] *****************************', 'success');
                addOutput('');
                addOutput('TASK [Update all packages] *********************************');
                addOutput('changed: [rhel-prod-01]');
                addOutput('changed: [rhel-prod-02]');
                addOutput('');
                addOutput('TASK [Reboot if required] **********************************');
                addOutput('ok: [rhel-prod-01]');
                addOutput('ok: [rhel-prod-02]');
                addOutput('');
                addOutput('PLAY RECAP **************************************************');
                addOutput('rhel-prod-01    : ok=15  changed=3   failed=0');
                addOutput('rhel-prod-02    : ok=15  changed=3   failed=0');
            } else {
                addOutput('Automation & Configuration Management:', 'success');
                addOutput('  ✓ Ansible playbooks for Red Hat patching');
                addOutput('  ✓ Python automation scripts');
                addOutput('  ✓ Infrastructure automation workflows');
                addOutput('Try: ansible playbook');
            }
            break;

        case 'git':
            if (args[1] === 'status') {
                addOutput('On branch main', 'success');
                addOutput('Your branch is up to date with \'origin/main\'.');
                addOutput('');
                addOutput('GitOps workflow active with ArgoCD');
            } else if (args[1] === 'log') {
                addOutput('commit a3f5e892b1c4 (HEAD -> main)', 'success');
                addOutput('Author: Muhammad Aiman <aiman@example.com>');
                addOutput('Date:   Mon Nov 11 2025');
                addOutput('');
                addOutput('    feat: implement monitoring stack with Prometheus & Grafana');
            } else {
                addOutput('Version Control & GitOps:', 'success');
                addOutput('  ✓ GitLab Enterprise CI/CD pipeline setup');
                addOutput('  ✓ ArgoCD + Gitea GitOps workflow');
                addOutput('  ✓ Automated deployment strategies');
                addOutput('Try: git status | git log');
            }
            break;

        case 'argocd':
            addOutput('ArgoCD Applications:', 'success');
            addOutput('');
            addOutput('NAME              SYNC STATUS   HEALTH STATUS');
            addOutput('monitoring-stack  Synced        Healthy');
            addOutput('telco-app         Synced        Healthy');
            addOutput('banking-platform  Synced        Healthy');
            addOutput('');
            addOutput('✓ Designed GitOps workflow using ArgoCD and Gitea for K3s cluster');
            break;

        case 'prometheus':
            addOutput('Prometheus targets:', 'success');
            addOutput('  kubernetes-nodes (3/3 up)');
            addOutput('  kubernetes-pods (24/24 up)');
            addOutput('  node-exporter (3/3 up)');
            addOutput('');
            addOutput('✓ Implemented monitoring solution using Prometheus, Grafana, and Loki');
            break;

        case 'aws':
            if (args[1] === 's3' && args[2] === 'ls') {
                addOutput('2024-11-01 12:34:56 data-lake-raw', 'success');
                addOutput('2024-11-01 12:34:57 data-lake-processed');
                addOutput('2024-11-01 12:34:58 app-backups');
            } else if (args[1] === 'ec2') {
                addOutput('INSTANCE ID          TYPE        STATE     NAME', 'success');
                addOutput('i-0a1b2c3d4e5f      t3.medium   running   app-server-prod');
                addOutput('i-1b2c3d4e5f6a      t3.large    running   db-server-prod');
            } else {
                addOutput('AWS Cloud expertise:', 'success');
                addOutput('  ✓ AWS Glue, Redshift, Athena, QuickSight');
                addOutput('  ✓ EC2, S3, CloudWatch management');
                addOutput('  ✓ Multi-account cloud architecture');
                addOutput('Try: aws s3 ls | aws ec2');
            }
            break;

        case '':
            // Empty command, do nothing
            break;

        default:
            addOutput(`Command not found: ${mainCmd}`, 'error');
            addOutput('Type "help" for available commands');
    }

    addOutput('');
}

// Handle terminal input
terminalInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        const command = terminalInput.value;
        processCommand(command);
        terminalInput.value = '';
    } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (historyIndex > 0) {
            historyIndex--;
            terminalInput.value = commandHistory[historyIndex];
        }
    } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (historyIndex < commandHistory.length - 1) {
            historyIndex++;
            terminalInput.value = commandHistory[historyIndex];
        } else {
            historyIndex = commandHistory.length;
            terminalInput.value = '';
        }
    } else if (e.key === 'Tab') {
        e.preventDefault();
        const input = terminalInput.value.toLowerCase();
        const words = input.split(' ');
        const lastWord = words[words.length - 1];

        // Auto-complete section names
        if (words[0] === 'cd' && words.length > 1) {
            const matches = Object.keys(terminalSections).filter(s => s.startsWith(lastWord));
            if (matches.length === 1) {
                words[words.length - 1] = matches[0];
                terminalInput.value = words.join(' ');
            }
        } else {
            // Auto-complete commands
            const commands = ['help', 'ls', 'cd', 'clear', 'whoami', 'kubectl', 'docker', 'terraform', 'ansible', 'git', 'argocd', 'prometheus', 'aws'];
            const matches = commands.filter(c => c.startsWith(input));
            if (matches.length === 1) {
                terminalInput.value = matches[0];
            }
        }
    }
});

// Keep focus on terminal input when clicking in terminal
interactiveTerminal.addEventListener('click', (e) => {
    if (e.target !== terminalClose && !e.target.closest('.terminal-close')) {
        terminalInput.focus();
    }
});

// Keyboard shortcut to toggle terminal (Ctrl + `)
document.addEventListener('keydown', (e) => {
    // Ctrl + ` (backtick) to toggle terminal
    if (e.ctrlKey && e.key === '`') {
        e.preventDefault();
        toggleTerminal();
    }
});
