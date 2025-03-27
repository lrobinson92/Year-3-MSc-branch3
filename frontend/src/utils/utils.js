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

  export const formatMarkdownToHTML = (markdown) => {
    if (!markdown) return '';
    
    // First, clean up standalone hashes (##) without text
    let cleanedMarkdown = markdown.replace(/^\s*#{1,6}\s*$/gm, '<hr class="section-divider" style="border-top: 1px solid #eaeaea; margin: 1.5rem 0;">');
    
    // Format headers with increased top margins
    let html = cleanedMarkdown
      .replace(/# (.*)/g, '<h1 style="font-size: 2.5rem; color: #333; margin-top: 2.5rem; margin-bottom: 1rem;">$1</h1>')
      .replace(/## (.*)/g, '<h2 style="font-size: 1.8rem; color: #444; margin-top: 2.2rem; margin-bottom: 0.8rem;">$1</h2>')
      .replace(/### (.*)/g, '<h3 style="font-size: 1.5rem; color: #555; margin-top: 2rem; margin-bottom: 0.7rem;">$1</h3>')
      .replace(/#### (.*)/g, '<h4 style="font-size: 1.3rem; color: #666; margin-top: 1.8rem; margin-bottom: 0.6rem;">$1</h4>');
  
    // Format bold text
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Format italic text
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    
    // Format lists
    html = html.replace(/^\s*- (.*)/gm, '<li style="margin-bottom: 0.5rem;">$1</li>');
    html = html.replace(/(<li[^>]*>.*<\/li>)\n(<li[^>]*>)/g, '$1$2');
    html = html.replace(/(<li[^>]*>.*<\/li>)(?:\n\n|\n$)/g, '<ul style="margin-bottom: 1rem; margin-top: 0.5rem; padding-left: 1.5rem;">$1</ul>');
    
    // Format paragraphs - but don't wrap existing HTML elements
    html = html.replace(/^([^<\n].*)/gm, '<p style="margin-bottom: 1rem; line-height: 1.6;">$1</p>');
    
    // Fix any double paragraph tags
    html = html.replace(/<p[^>]*><p[^>]*>/g, '<p>');
    html = html.replace(/<\/p><\/p>/g, '</p>');
    
    // Add horizontal lines
    html = html.replace(/---/g, '<hr style="border: 0; height: 1px; background-color: #ddd; margin: 2.5rem 0;">');
  
    // Clean up any remaining hashes that might have been missed
    html = html.replace(/#{1,6}/g, '');
  
    return html;
  };