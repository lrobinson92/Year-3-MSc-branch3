export const toTitleCase = (str) => {
    return str.replace(/_/g, ' ').replace(/\w\S*/g, (txt) => {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
};

export const formatDate = (dateString) => {
    const options = { day: '2-digit', month: 'short', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-GB', options).replace(/ /g, '-');
};

export const combineShortParagraphs = (html) => {
    const container = document.createElement('div');
    container.innerHTML = html;
  
    const paragraphs = Array.from(container.children); // NOT just <p> now
  
    let newHTML = '';
    let buffer = '';
  
    paragraphs.forEach((el) => {
      const tag = el.tagName.toLowerCase();
      const text = el.textContent.trim();
  
      if (['h1', 'h2', 'h3'].includes(tag)) {
        // Flush buffer before heading
        if (buffer) {
          newHTML += `<p>${buffer.trim()}</p>`;
          buffer = '';
        }
        newHTML += `<${tag}>${text}</${tag}>`;
      } else if (tag === 'p') {
        if (text.length < 80 && !text.endsWith('.')) {
          buffer += text + ' ';
        } else {
          buffer += text;
          newHTML += `<p>${buffer.trim()}</p>`;
          buffer = '';
        }
      } else {
        // fallback: just include element
        newHTML += el.outerHTML;
      }
    });
  
    if (buffer) {
      newHTML += `<p>${buffer.trim()}</p>`;
    }
  
    return newHTML;
  };