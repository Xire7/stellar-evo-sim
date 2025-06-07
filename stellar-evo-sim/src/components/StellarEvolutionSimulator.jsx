import React, { useState, useEffect, useRef, useCallback } from 'react';

const StellarEvolutionSimulator = () => {
  const [mass, setMass] = useState(1.0);
  const [age, setAge] = useState(0);
  const [phase, setPhase] = useState('main-sequence');
  const [isRunning, setIsRunning] = useState(false);

  const [maxAge, setMaxAge] = useState(10000);
  
  const intervalRef = useRef(null);
  const starRef = useRef(null);
  const fusionRef = useRef(null);

  const phases = {
    'main-sequence': {
      title: 'Main Sequence Star',
      description: 'Hydrogen is fusing into helium in the core, providing the energy that makes the star shine. The star is in hydrostatic equilibrium - gravity pulling inward balanced by radiation pressure pushing outward.',
      duration: 0.9
    },
    'red-giant': {
      title: 'Red Giant Phase',
      description: 'Hydrogen in the core is exhausted. The core contracts and heats up while the outer layers expand dramatically. Hydrogen shell burning occurs around the inert helium core.',
      duration: 0.08
    },
    'helium-burning': {
      title: 'Helium Burning Phase',
      description: 'The core temperature reaches 100 million K, igniting helium fusion (triple-alpha process). Carbon and oxygen are produced in the core.',
      duration: 0.02
    },
    'asymptotic-giant': {
      title: 'Asymptotic Giant Branch',
      description: 'Alternating hydrogen and helium shell burning creates thermal pulses. Strong stellar winds begin to eject the outer layers.',
      duration: 0.01
    },
    'planetary-nebula': {
      title: 'Planetary Nebula',
      description: 'The outer layers are ejected, creating a beautiful nebula. The hot core is exposed as a white dwarf precursor.',
      duration: 0.001
    },
    'white-dwarf': {
      title: 'White Dwarf',
      description: 'A hot, dense stellar remnant supported by electron degeneracy pressure. No fusion occurs - it slowly cools over billions of years.',
      duration: 0
    },
    'supernova': {
      title: 'Supernova Explosion',
      description: 'Core collapse occurs when iron builds up. The explosive death creates and disperses heavy elements throughout the galaxy.',
      duration: 0.001
    },
    'neutron-star': {
      title: 'Neutron Star',
      description: 'An incredibly dense remnant where protons and electrons are crushed together. A teaspoon would weigh as much as a mountain!',
      duration: 0
    },
    'black-hole': {
      title: 'Black Hole',
      description: 'Gravitational collapse has created a region where spacetime is so curved that nothing, not even light, can escape.',
      duration: 0
    }
  };

  const calculateLifetime = useCallback((stellarMass) => {
    const stellarData = getStellarData(stellarMass);
    return stellarData.lifetime * 1000; // Convert from Gyr to Myr for consistency with display
  }, []);

  const getStarPhases = useCallback((stellarMass) => {
    if (stellarMass < 0.8) {
      return ['main-sequence', 'white-dwarf'];
    } else if (stellarMass < 8) {
      return ['main-sequence', 'red-giant', 'helium-burning', 'asymptotic-giant', 'planetary-nebula', 'white-dwarf'];
    } else {
      if (stellarMass < 20) {
        return ['main-sequence', 'red-giant', 'helium-burning', 'supernova', 'neutron-star'];
      } else {
        return ['main-sequence', 'red-giant', 'helium-burning', 'supernova', 'black-hole'];
      }
    }
  }, []);

  const getCurrentPhase = useCallback((currentAge, currentMaxAge, stellarMass) => {
    const stellarPhases = getStarPhases(stellarMass);
    const progress = currentAge / currentMaxAge;
    const phaseIndex = Math.floor(progress * stellarPhases.length);
    
    // Ensure we don't go beyond the available phases
    if (phaseIndex >= stellarPhases.length) {
      return stellarPhases[stellarPhases.length - 1];
    }
    
    return stellarPhases[phaseIndex];
  }, [getStarPhases]);

  const getStellarData = useCallback((stellarMass) => {
    // Empirical data based on real stellar observations
    const stellarTable = [
      // [Mass, Temperature, Radius, Luminosity, Lifetime_Gyr]
      [0.1, 2800, 0.16, 0.000008, 10000],
      [0.2, 3200, 0.25, 0.00008, 2500],
      [0.3, 3400, 0.36, 0.0004, 1100],
      [0.5, 3800, 0.54, 0.003, 200],
      [0.7, 4200, 0.70, 0.02, 50],
      [0.8, 4600, 0.84, 0.04, 20],
      [1.0, 5800, 1.00, 1.0, 10],     // Sun
      [1.2, 6200, 1.15, 2.2, 5],
      [1.5, 6800, 1.35, 5.4, 2.5],
      [2.0, 8200, 1.80, 16, 1.0],
      [3.0, 11000, 2.50, 60, 0.37],
      [5.0, 17000, 3.80, 600, 0.1],
      [8.0, 25000, 5.50, 4000, 0.03],
      [10.0, 30000, 6.50, 10000, 0.02],
      [15.0, 35000, 8.50, 30000, 0.01],
      [20.0, 40000, 10.0, 70000, 0.007],
      [25.0, 44000, 12.0, 120000, 0.005],
      [30.0, 46000, 14.0, 200000, 0.004],
      [40.0, 50000, 18.0, 400000, 0.003],
      [50.0, 52000, 22.0, 700000, 0.002]
    ];

    // Find the closest mass values for interpolation
    let lowerIndex = 0;
    let upperIndex = stellarTable.length - 1;
    
    for (let i = 0; i < stellarTable.length - 1; i++) {
      if (stellarMass >= stellarTable[i][0] && stellarMass <= stellarTable[i + 1][0]) {
        lowerIndex = i;
        upperIndex = i + 1;
        break;
      }
    }
    
    const lower = stellarTable[lowerIndex];
    const upper = stellarTable[upperIndex];
    
    // If exact match, return it
    if (lower[0] === stellarMass) return { temperature: lower[1], radius: lower[2], luminosity: lower[3], lifetime: lower[4] };
    if (upper[0] === stellarMass) return { temperature: upper[1], radius: upper[2], luminosity: upper[3], lifetime: upper[4] };
    
    // Linear interpolation
    const fraction = (stellarMass - lower[0]) / (upper[0] - lower[0]);
    
    return {
      temperature: lower[1] + fraction * (upper[1] - lower[1]),
      radius: lower[2] + fraction * (upper[2] - lower[2]),
      luminosity: lower[3] + fraction * (upper[3] - lower[3]),
      lifetime: lower[4] + fraction * (upper[4] - lower[4])
    };
  }, []);

  const getStellarProperties = useCallback((currentPhase, stellarMass) => {
    const baseData = getStellarData(stellarMass);
    
    // Modify properties based on phase
    switch(currentPhase) {
      case 'red-giant':
        return {
          ...baseData,
          radius: baseData.radius * 10,
          temperature: baseData.temperature * 0.7
        };
      case 'white-dwarf':
        return {
          ...baseData,
          radius: 0.01,
          temperature: 50000,
          luminosity: 0.001
        };
      case 'neutron-star':
        return {
          ...baseData,
          radius: 0.00001,
          temperature: 1000000,
          luminosity: 0.0001
        };
      case 'black-hole':
        return {
          ...baseData,
          radius: 0.000001,
          temperature: 0,
          luminosity: 0
        };
      default:
        return baseData;
    }
  }, [getStellarData]);

  const updateStellarVisuals = useCallback((currentPhase, properties) => {
    if (starRef.current) {
      const baseSize = 60;
      const visualRadius = Math.min(baseSize * Math.log10(properties.radius * 10), 200);
      starRef.current.style.width = `${visualRadius}px`;
      starRef.current.style.height = `${visualRadius}px`;
    }
    
    if (fusionRef.current) {
      const showFusion = ['main-sequence', 'helium-burning'].includes(currentPhase);
      fusionRef.current.style.display = showFusion ? 'block' : 'none';
    }
  }, []);

  const start = useCallback(() => {
    setIsRunning(true);
    const phaseTimeMs = 5000; // 5 seconds per phase
    const timeStep = 100; // Update every 100ms
    const totalTicks = phaseTimeMs / timeStep; // 50 ticks per phase
    
    // Calculate which phases this star will go through
    const stellarPhases = getStarPhases(mass);
    const totalPhases = stellarPhases.length;
    const ageIncrementPerTick = maxAge / (totalPhases * totalTicks);
    
    intervalRef.current = setInterval(() => {
      setAge(currentAge => {
        const newAge = currentAge + ageIncrementPerTick;
        
        // Check if we've completed all phases
        if (newAge >= maxAge) {
          setIsRunning(false);
          return maxAge; // Ensure we reach exactly maxAge
        }
        
        return newAge;
      });
    }, timeStep);
  }, [maxAge, mass, getStarPhases]);

  const pause = useCallback(() => {
    setIsRunning(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const reset = useCallback(() => {
    pause();
    setAge(0);
    setPhase('main-sequence');
  }, [pause]);

  const handleMassChange = useCallback((newMass) => {
    setMass(newMass);
    const newMaxAge = calculateLifetime(newMass);
    setMaxAge(newMaxAge);
    reset();
  }, [calculateLifetime, reset]);

  // Update phase when age changes
  useEffect(() => {
    const currentPhase = getCurrentPhase(age, maxAge, mass);
    if (currentPhase !== phase) {
      setPhase(currentPhase);
    }
  }, [age, maxAge, mass, phase, getCurrentPhase]);

  // Update visuals when phase changes
  useEffect(() => {
    const properties = getStellarProperties(phase, mass);
    updateStellarVisuals(phase, properties);
  }, [phase, mass, getStellarProperties, updateStellarVisuals]);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Stop interval when isRunning becomes false
  useEffect(() => {
    if (!isRunning && intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, [isRunning]);

  const properties = getStellarProperties(phase, mass);
  const progress = Math.min(age / maxAge, 1);

  return (
    <div className="stellar-simulator">
      <div className="container">
        <div className="header">
          <h1>Stellar Evolution Simulator</h1>
          <h3>By Zion Mateo</h3>
          <p>Explore how stars live and die based on their initial mass!</p>
        </div>

        <div className="main-content">
          <div className="simulation-area">
            <div className="star-container">
              <div 
                ref={starRef}
                className={`star ${phase}`}
              />
              <div ref={fusionRef} className="fusion-indicator" />
              {(phase === 'supernova' || phase === 'asymptotic-giant' || phase === 'planetary-nebula') && (
                <div className="stellar-wind" />
              )}
            </div>
            
            <div className="phase-info">
              <h3>{phases[phase]?.title}</h3>
              <p>{phases[phase]?.description}</p>
            </div>

            <div className="timeline">
              <h4>Stellar Lifetime Progress</h4>
              <div className="timeline-bar">
                <div 
                  className="timeline-progress" 
                  style={{ width: `${progress * 100}%` }}
                />
              </div>
              <div className="stats">
                <div className="stat-card">
                  <div className="stat-value">{Math.round(age)}</div>
                  <div className="stat-label">Million Years</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{Math.round(properties.temperature)}</div>
                  <div className="stat-label">Temperature (K)</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{properties.radius.toFixed(3)}</div>
                  <div className="stat-label">Solar Radii</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{properties.luminosity.toFixed(2)}</div>
                  <div className="stat-label">Solar Luminosity</div>
                </div>
              </div>
              
              <div className="equations-section">
                <h4>Mass-Stellar Property Relations</h4>
                <div className="equations-grid">
                  <div className="equation-card">
                    <div className="equation-title">Temperature</div>
                    <div className="equation">T = 5800 × M<sup>0.5</sup> K</div>
                    <div className="equation-result">T = {Math.round(5800 * Math.pow(mass, 0.5))} K</div>
                  </div>
                  <div className="equation-card">
                    <div className="equation-title">Radius</div>
                    <div className="equation">R = M<sup>0.8</sup> R<sub>☉</sub></div>
                    <div className="equation-result">R = {Math.pow(mass, 0.8).toFixed(3)} R<sub>☉</sub></div>
                  </div>
                  <div className="equation-card">
                    <div className="equation-title">Luminosity</div>
                    <div className="equation">L = M<sup>3.5</sup> L<sub>☉</sub></div>
                    <div className="equation-result">L = {Math.pow(mass, 3.5).toFixed(2)} L<sub>☉</sub></div>
                  </div>
                  <div className="equation-card">
                    <div className="equation-title">Lifetime</div>
                    <div className="equation">τ = 10<sup>10</sup> × M<sup>-2.5</sup> years</div>
                    <div className="equation-result">τ = {(calculateLifetime(mass) / 1000).toFixed(1)} billion years</div>
                  </div>
                </div>
                <div className="scaling-explanation">
                  <p><strong>Important Disclaimer:</strong> These relationships are simplified educational approximations for main sequence stars. The <strong>luminosity</strong> (L ∝ M<sup>3.5</sup>) and <strong>lifetime</strong> (τ ∝ M<sup>-2.5</sup>) scaling laws are well-established and broadly accurate across stellar masses.</p>
                  
                  <p><strong>Temperature and radius relationships are observational fits</strong> that provide reasonable estimates but vary significantly across different stellar mass ranges and evolutionary phases. Real stellar properties depend on complex physics including metallicity, rotation, magnetic fields, and convection efficiency. Professional stellar models use sophisticated stellar structure equations rather than simple power laws.</p>
                  
                  <p>This simulator uses interpolated observational data for more accurate values, while displaying the simplified relationships for educational comparison.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="controls">
            <div className="control-group">
              <label htmlFor="massSlider">Initial Stellar Mass</label>
              <div className="slider-container">
                <input 
                  type="range" 
                  id="massSlider"
                  className="slider" 
                  min="0.5" 
                  max="50" 
                  step="0.5" 
                  value={mass}
                  onChange={(e) => handleMassChange(parseFloat(e.target.value))}
                />
                <div className="value-display">{mass} Solar Masses</div>
              </div>
            </div>

            <div className="control-buttons">
              <button 
                className="btn" 
                onClick={isRunning ? pause : start}
              >
                {isRunning ? 'Pause' : 'Start Evolution'}
              </button>
              <button className="btn secondary" onClick={reset}>
                Reset
              </button>
            </div>

            <div className="control-group" style={{ marginTop: '25px' }}>
              <label>Quick Presets:</label>
              <div className="control-buttons">
                <button className="btn" onClick={() => handleMassChange(0.5)}>
                  Red Dwarf
                </button>
                <button className="btn" onClick={() => handleMassChange(1.0)}>
                  Sun-like
                </button>
              </div>
              <div className="control-buttons" style={{ marginTop: '10px' }}>
                <button className="btn" onClick={() => handleMassChange(8)}>
                  Massive
                </button>
                <button className="btn" onClick={() => handleMassChange(25)}>
                  Supergiant
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        .stellar-simulator {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%);
          color: white;
          min-height: 100vh;
          overflow-x: hidden;
        }

        .container {
          max-width: 1400px;
          margin: 0 auto;
          padding: 20px;
        }

        .header {
          text-align: center;
          margin-bottom: 30px;
        }

        .header h1 {
          font-size: 2.5rem;
          background: linear-gradient(45deg, #ff6b6b, #4ecdc4, #45b7d1);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 10px;
        }

        .main-content {
          display: grid;
          grid-template-columns: 1fr 400px;
          gap: 30px;
          align-items: start;
        }

        .simulation-area {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 20px;
          padding: 30px;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .controls {
          background: rgba(255, 255, 255, 0.08);
          border-radius: 20px;
          padding: 25px;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .star-container {
          position: relative;
          width: 100%;
          height: 400px;
          background: radial-gradient(circle at center, #000033 0%, #000000 70%);
          border-radius: 15px;
          overflow: hidden;
          margin-bottom: 20px;
        }

        .star {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          border-radius: 50%;
          transition: all 1.5s ease-in-out;
          box-shadow: 0 0 50px currentColor;
        }

        .star.main-sequence {
          background: radial-gradient(circle, #ffff00 0%, #ff8800 70%, #ff4400 100%);
          color: #ffff00;
        }

        .star.red-giant {
          background: radial-gradient(circle, #ff4444 0%, #cc0000 70%, #880000 100%);
          color: #ff4444;
        }

        .star.white-dwarf {
          background: radial-gradient(circle, #ffffff 0%, #ccccff 70%, #8888ff 100%);
          color: #ffffff;
        }

        .star.neutron-star {
          background: radial-gradient(circle, #8888ff 0%, #4444cc 70%, #222288 100%);
          color: #8888ff;
        }

        .star.black-hole {
          background: radial-gradient(circle, #000000 0%, #333333 70%, #000000 100%);
          color: #ffffff;
          border: 2px solid #ff4444;
        }

        .star.supernova {
          background: radial-gradient(circle, #ffffff 0%, #ffff44 30%, #ff4444 60%, #8844ff 100%);
          color: #ffffff;
          animation: supernova-blast 2s ease-out;
        }

        .star.helium-burning {
          background: radial-gradient(circle, #ffaa00 0%, #ff6600 70%, #cc4400 100%);
          color: #ffaa00;
        }

        .star.asymptotic-giant {
          background: radial-gradient(circle, #ff6666 0%, #dd2222 70%, #aa0000 100%);
          color: #ff6666;
        }

        .star.planetary-nebula {
          background: radial-gradient(circle, #66ffff 0%, #2299ff 70%, #0066cc 100%);
          color: #66ffff;
        }

        @keyframes supernova-blast {
          0% { transform: translate(-50%, -50%) scale(1); }
          50% { transform: translate(-50%, -50%) scale(3); box-shadow: 0 0 200px #ffffff; }
          100% { transform: translate(-50%, -50%) scale(1); }
        }

        .stellar-wind {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 200px;
          height: 200px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-radius: 50%;
          animation: wind-expand 3s ease-out infinite;
        }

        @keyframes wind-expand {
          0% { width: 0; height: 0; opacity: 1; }
          100% { width: 400px; height: 400px; opacity: 0; }
        }

        .phase-info {
          background: rgba(0, 0, 0, 0.7);
          border-radius: 15px;
          padding: 20px;
          margin-top: 20px;
        }

        .phase-info h3 {
          color: #4ecdc4;
          margin-bottom: 10px;
          font-size: 1.3rem;
        }

        .control-group {
          margin-bottom: 25px;
        }

        .control-group label {
          display: block;
          margin-bottom: 8px;
          font-weight: 600;
          color: #4ecdc4;
        }

        .slider-container {
          position: relative;
          margin-bottom: 10px;
        }

        .slider {
          width: 100%;
          height: 8px;
          border-radius: 5px;
          background: linear-gradient(90deg, #333 0%, #666 100%);
          outline: none;
          -webkit-appearance: none;
        }

        .slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: linear-gradient(45deg, #ff6b6b, #4ecdc4);
          cursor: pointer;
          box-shadow: 0 0 10px rgba(255, 255, 255, 0.3);
        }

        .slider::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: linear-gradient(45deg, #ff6b6b, #4ecdc4);
          cursor: pointer;
          border: none;
        }

        .value-display {
          text-align: center;
          margin-top: 5px;
          font-size: 0.9rem;
          color: #fff;
        }

        .control-buttons {
          display: flex;
          gap: 10px;
          margin-top: 20px;
        }

        .btn {
          flex: 1;
          padding: 12px 20px;
          border: none;
          border-radius: 25px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          background: linear-gradient(45deg, #ff6b6b, #4ecdc4);
          color: white;
        }

        .btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(255, 255, 255, 0.2);
        }

        .btn:active {
          transform: translateY(0);
        }

        .btn.secondary {
          background: linear-gradient(45deg, #45b7d1, #96c93d);
        }

        .timeline {
          margin-top: 20px;
          padding: 15px;
          background: rgba(0, 0, 0, 0.5);
          border-radius: 10px;
        }

        .timeline h4 {
          color: #4ecdc4;
          margin-bottom: 10px;
        }

        .timeline-bar {
          width: 100%;
          height: 10px;
          background: #333;
          border-radius: 5px;
          overflow: hidden;
          margin-bottom: 10px;
        }

        .timeline-progress {
          height: 100%;
          background: linear-gradient(90deg, #ff6b6b, #4ecdc4, #45b7d1);
          width: 0%;
          transition: width 0.5s ease;
        }

        .stats {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
          margin-top: 20px;
        }

        .stat-card {
          background: rgba(255, 255, 255, 0.05);
          padding: 15px;
          border-radius: 10px;
          text-align: center;
        }

        .stat-value {
          font-size: 1.5rem;
          font-weight: bold;
          color: #4ecdc4;
        }

        .stat-label {
          font-size: 0.9rem;
          color: #ccc;
          margin-top: 5px;
        }

        .fusion-indicator {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 60%;
          height: 60%;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(255, 255, 0, 0.3) 0%, transparent 70%);
          animation: fusion-pulse 2s ease-in-out infinite;
        }

        @keyframes fusion-pulse {
          0%, 100% { opacity: 0.3; transform: translate(-50%, -50%) scale(1); }
          50% { opacity: 0.8; transform: translate(-50%, -50%) scale(1.1); }
        }

        .equations-section {
          margin-top: 25px;
          padding: 20px;
          background: rgba(255, 255, 255, 0.08);
          border-radius: 15px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .equations-section h4 {
          color: #4ecdc4;
          margin-bottom: 15px;
          text-align: center;
          font-size: 1.2rem;
        }

        .equations-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
          margin-bottom: 15px;
        }

        .equation-card {
          background: rgba(0, 0, 0, 0.4);
          padding: 15px;
          border-radius: 10px;
          text-align: center;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .equation-title {
          font-weight: bold;
          color: #ff6b6b;
          margin-bottom: 8px;
          font-size: 0.9rem;
        }

        .equation {
          font-family: 'Courier New', monospace;
          color: #4ecdc4;
          margin-bottom: 8px;
          font-size: 0.95rem;
        }

        .equation-result {
          color: #45b7d1;
          font-weight: bold;
          font-size: 0.9rem;
        }

        .scaling-explanation {
          background: rgba(0, 0, 0, 0.3);
          padding: 15px;
          border-radius: 8px;
          border-left: 4px solid #4ecdc4;
        }

        .scaling-explanation p {
          margin: 0 0 12px 0;
          font-size: 0.9rem;
          line-height: 1.4;
          color: #e0e0e0;
        }

        .scaling-explanation p:last-child {
          margin-bottom: 0;
        }

        @media (max-width: 768px) {
          .main-content {
            grid-template-columns: 1fr;
            gap: 20px;
          }
          
          .equations-grid {
            grid-template-columns: 1fr;
          }
          
          .equation-card {
            padding: 12px;
          }
          
          .equation-title {
            font-size: 0.85rem;
          }
          
          .equation {
            font-size: 0.9rem;
          }
          
          .equation-result {
            font-size: 0.85rem;
          }
          
          .scaling-explanation p {
            font-size: 0.85rem;
          }
        }
      `}</style>
    </div>
  );
};

export default StellarEvolutionSimulator;