document.addEventListener('DOMContentLoaded', () => {
    // 1. Module Selection Logic (Active states)
    const modules = document.querySelectorAll('.module-card');
    modules.forEach(mod => {
        mod.addEventListener('click', (e) => {
            // Prevent interference with form elements inside cards
            if(e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
            
            modules.forEach(m => m.classList.remove('active'));
            mod.classList.add('active');
            
            const moduleName = mod.querySelector('h2').innerText;
            logEvent(`Module Selected: ${moduleName}`);
            
            // Optionally, we could expand/update related panels here
            // Currently represented via visual active state and log event
        });
    });

    // 2. Custom Tooltip Logic
    const tooltip = document.getElementById('custom-tooltip');
    document.querySelectorAll('[data-tooltip]').forEach(el => {
        el.addEventListener('mousemove', (e) => {
            tooltip.innerText = el.getAttribute('data-tooltip');
            tooltip.style.opacity = '1';
            tooltip.style.left = (e.pageX + 15) + 'px';
            tooltip.style.top = (e.pageY + 15) + 'px';
        });
        el.addEventListener('mouseleave', () => {
            tooltip.style.opacity = '0';
        });
    });

    // 3. Progress Logging
    const progressLog = document.getElementById('progress-log');
    function logEvent(message, highlight = false) {
        const li = document.createElement('li');
        if (highlight) li.classList.add('highlight');
        
        const now = new Date();
        const timeStr = `[${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}]`;
        
        li.innerHTML = `<span class="time">${timeStr}</span> > ${message}`;
        progressLog.appendChild(li);
        progressLog.scrollTop = progressLog.scrollHeight; // Auto-scroll
    }

    // 4. Simulation Controls & Mock Logic
    const runBtn = document.getElementById('run-sim-btn');
    const resetBtn = document.getElementById('reset-sim-btn');
    const chartLine = document.querySelector('.chart-line');
    const riskBadge = document.getElementById('risk-badge');
    const riskFill = document.getElementById('risk-fill');
    
    runBtn.addEventListener('click', () => {
        // Gathering inputs
        const genotype = document.getElementById('genotype-select').value;
        const dose = parseInt(document.getElementById('dose-amount').value, 10);
        
        logEvent('-----------------------------------');
        logEvent('Initializing parameters calculation...', true);
        logEvent(`Genotype: ${genotype.toUpperCase()} | Dose: ${dose}mg`);
        
        // Resetting chart animation to re-trigger
        chartLine.style.animation = 'none';
        
        // Timeout to match "processing" effect
        setTimeout(() => {
            chartLine.style.animation = 'drawLine 2s forwards ease-out';
            
            // Evaluate mock risk
            if (genotype === 'poor' || dose > 600) {
                riskBadge.className = 'risk-badge danger';
                riskBadge.innerText = 'CRITICAL';
                riskFill.style.width = '85%';
                logEvent('WARNING: Toxicity threshold exceeded! Liver stress critical.', true);
                document.getElementById('state-summary').innerHTML = `
                    <div class="summary-item"><span class="label">Status:</span> <span class="value" style="color:var(--danger)">Dangerous</span></div>
                    <div class="summary-item"><span class="label">Toxicity Buildup:</span> <span class="value">High (85%)</span></div>
                `;
            } else if (genotype === 'rapid') {
                riskBadge.className = 'risk-badge warning';
                riskBadge.innerText = 'ELEVATED';
                riskFill.style.width = '55%';
                logEvent('NOTICE: Metabolization rapid. Potential loss of efficacy.');
                document.getElementById('state-summary').innerHTML = `
                    <div class="summary-item"><span class="label">Status:</span> <span class="value" style="color:var(--warning)">Elevated</span></div>
                    <div class="summary-item"><span class="label">Toxicity Buildup:</span> <span class="value">Medium (55%)</span></div>
                `;
            } else {
                riskBadge.className = 'risk-badge safe';
                riskBadge.innerText = 'SAFE';
                riskFill.style.width = '30%';
                logEvent('Simulation Complete: Nominal limits observed.');
                document.getElementById('state-summary').innerHTML = `
                    <div class="summary-item"><span class="label">Status:</span> <span class="value nominal">Nominal</span></div>
                    <div class="summary-item"><span class="label">Toxicity Buildup:</span> <span class="value">Low (12%)</span></div>
                `;
            }
        }, 300); // slight delay
    });

    resetBtn.addEventListener('click', () => {
        chartLine.style.animation = 'none';
        riskBadge.className = 'risk-badge safe';
        riskBadge.innerText = 'SAFE';
        riskFill.style.width = '20%';
        document.getElementById('dose-amount').value = 500;
        document.getElementById('genotype-select').value = 'normal';
        logEvent('System state reset to baseline.');
        document.getElementById('state-summary').innerHTML = `
            <div class="summary-item"><span class="label">Status:</span> <span class="value nominal">Nominal</span></div>
            <div class="summary-item"><span class="label">Toxicity Buildup:</span> <span class="value">Low (12%)</span></div>
        `;
    });
});
