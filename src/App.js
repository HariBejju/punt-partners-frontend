import React, { useState, useEffect } from 'react';
import './App.css';
import Zoom from 'react-reveal/Zoom';
import Fade from 'react-reveal/Fade';

const App = () => {
  const [fonts, setFonts] = useState({});
  const [fontFamily, setFontFamily] = useState('');
  const [variant, setVariant] = useState('');
  const [italic, setItalic] = useState(false);
  const [text, setText] = useState('');

  useEffect(() => {
    // Fetch fonts.json from the public directory
    fetch('/fonts.json')
      .then(response => response.json())
      .then(data => {
        setFonts(data);
        const defaultFamily = Object.keys(data)[0];
        setFontFamily(defaultFamily);
        setVariant(Object.keys(data[defaultFamily])[0]); // Set default variant
      });

    // Load saved state from localStorage
    const savedText = localStorage.getItem('text');
    const savedFontFamily = localStorage.getItem('fontFamily');
    const savedVariant = localStorage.getItem('variant');
    const savedItalic = localStorage.getItem('italic') === 'true';

    if (savedText) setText(savedText);
    if (savedFontFamily) setFontFamily(savedFontFamily);
    if (savedVariant) setVariant(savedVariant);
    if (savedItalic !== null) setItalic(savedItalic);
  }, []);

  useEffect(() => {
    // Generate @font-face rules dynamically
    const styleSheet = document.createElement('style');
    styleSheet.type = 'text/css';

    const fontFaces = Object.keys(fonts).map(font => {
      const variants = fonts[font];
      return Object.keys(variants).map(variant => {
        const isItalic = variant.includes('italic');
        return `
          @font-face {
            font-family: '${font}';
            font-weight: ${isItalic ? 'normal' : variant.replace('italic', '')};
            font-style: ${isItalic ? 'italic' : 'normal'};
            src: url('${variants[variant]}') format('woff2');
          }
        `;
      }).join(' ');
    }).join(' ');

    styleSheet.textContent = fontFaces;
    document.head.appendChild(styleSheet);

    return () => {
      document.head.removeChild(styleSheet);
    };
  }, [fonts]);

  const findBestMatch = (currentVariant, availableVariants) => {
    const { weight: currentWeight, italic: currentItalic } = currentVariant;

    // Check for exact match
    const exactMatch = availableVariants.find(v => v.weight === currentWeight && v.italic === currentItalic);
    if (exactMatch) return exactMatch;

    // Check for italic variant
    if (currentItalic) {
      const italicVariants = availableVariants.filter(v => v.italic);
      const closestItalic = italicVariants.reduce((closest, v) => {
        if (!closest || Math.abs(v.weight - currentWeight) < Math.abs(closest.weight - currentWeight)) {
          return v;
        }
        return closest;
      }, null);
      if (closestItalic) return closestItalic;
    }

    // Check for closest weight
    const closestWeight = availableVariants.reduce((closest, v) => {
      if (!closest || Math.abs(v.weight - currentWeight) < Math.abs(closest.weight - currentWeight)) {
        return v;
      }
      return closest;
    }, null);

    return closestWeight;
  };

  const handleFontFamilyChange = (e) => {
    const newFontFamily = e.target.value;
    setFontFamily(newFontFamily);

    if (fonts[newFontFamily]) {
      const availableVariants = Object.keys(fonts[newFontFamily]).map(key => ({
        weight: key.replace(/italic$/, ''),
        italic: key.includes('italic')
      }));

      const currentVariantObj = {
        weight: variant.replace(/italic$/, ''),
        italic
      };

      const bestMatch = findBestMatch(currentVariantObj, availableVariants);
      if (bestMatch) {
        setVariant(`${bestMatch.weight}${bestMatch.italic ? 'italic' : ''}`);
      }
    }
  };

  const handleVariantChange = (e) => {
    setVariant(e.target.value);
  };

  const handleSave = () => {
    localStorage.setItem('text', text);
    localStorage.setItem('fontFamily', fontFamily);
    localStorage.setItem('variant', variant);
    localStorage.setItem('italic', italic.toString());
  };

  const handleReset = () => {
    setText('');
    setFontFamily(Object.keys(fonts)[0]);
    setVariant(Object.keys(fonts[Object.keys(fonts)[0]])[0]);
    setItalic(false);
  };

  return (
    <div className="App">
    <Zoom>
      <div className="title">
        Notepad lite
      </div>
      </Zoom>
      <Fade>
      <div className="controls">
        <label>
          Font Family:
          <select value={fontFamily} onChange={handleFontFamilyChange}>
            {Object.keys(fonts).map(font => (
              <option key={font} value={font}>{font}</option>
            ))}
          </select>
        </label>
        <label>
          Variant:
          <select value={variant} onChange={handleVariantChange}>
            {fonts[fontFamily] && Object.keys(fonts[fontFamily]).map(variant => (
              <option key={variant} value={variant}>
                {variant.includes('italic') ? 'Italic' : `Weight ${variant}`}
              </option>
            ))}
          </select>
        </label>
        <label id="italic-label">
          Italic:
          <input
            type="checkbox"
            id="switch"
            className="switch"
            checked={italic}
            onChange={() => setItalic(!italic)}
            disabled={!fonts[fontFamily] || !Object.keys(fonts[fontFamily]).some(v => v.includes('italic'))}
          />
          <label htmlFor="switch" className="toggle-switch"></label>
        </label>
      </div>
      <textarea
        className="text-editor"
        style={{
          fontFamily: fontFamily,
          fontWeight: variant.includes('italic') ? 'normal' : variant.replace('italic', ''),
          fontStyle: italic ? 'italic' : 'normal'
        }}
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <div className="buttons">
        <button onClick={handleSave}>Save</button>
        <button onClick={handleReset}>Reset</button>
      </div>
      </Fade>
    </div>
  );
};

export default App;
