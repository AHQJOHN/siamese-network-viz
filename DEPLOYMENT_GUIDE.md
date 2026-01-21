# GitHub Pages Deployment Guide

## 📋 Quick Reference

Your visualization is ready to be hosted on GitHub Pages!

## 🎯 Files Ready for Deployment

✅ **index.html** - Main page
✅ **js/network-visualization.js** - Visualization code
✅ **siamese_network_visualization.gif** - Preview image
✅ **README.md** - Documentation
✅ **.gitignore** - Excludes development files

## 🚀 Deployment Steps

### 1. Create GitHub Repository

```bash
# Navigate to project directory
cd /home/ml-team/Documents/dummy

# Initialize git repository
git init

# Add files
git add index.html js/ siamese_network_visualization.gif README.md .gitignore
git commit -m "Initial commit: Hybrid Siamese Network Visualization"
```

### 2. Push to GitHub

**First, create a new repository on GitHub:**
- Go to: https://github.com/new
- Name: `siamese-network-viz` (or your choice)
- Description: "Interactive 3D visualization of Hybrid Siamese Network"
- Visibility: Public
- **Don't** check "Add a README file"
- Click "Create repository"

**Then push your code:**

```bash
# Add your GitHub repository as remote (replace YOUR-USERNAME)
git remote add origin https://github.com/YOUR-USERNAME/siamese-network-viz.git

# Push to main branch
git branch -M main
git push -u origin main
```

### 3. Enable GitHub Pages

1. Go to your repository on GitHub
2. Click **Settings** (⚙️)
3. Click **Pages** in the left sidebar
4. Under **Source**:
   - Branch: `main`
   - Folder: `/ (root)`
5. Click **Save**

### 4. Access Your Live Site

After 1-2 minutes, your site will be available at:

```
https://YOUR-USERNAME.github.io/siamese-network-viz/
```

Replace `YOUR-USERNAME` with your actual GitHub username!

## ✏️ Update README with Your URL

Once deployed, update the README.md:

```markdown
🔗 **[Live Demo](https://YOUR-USERNAME.github.io/siamese-network-viz/)**
```

Then commit and push:

```bash
git add README.md
git commit -m "Update live demo URL"
git push
```

## 🔄 Making Updates

To update your live site:

```bash
# Make changes to your files
# ...

# Commit and push
git add .
git commit -m "Description of changes"
git push

# Changes will appear in 1-2 minutes
```

## 🎨 Customization Ideas

### Change Colors
Edit `index.html` CSS:
```css
#ui-layer {
    background: rgba(5, 5, 16, 0.8);  /* Change this */
    border-left: 3px solid #00d2ff;   /* And this */
}
```

### Adjust Animation Speed
Edit `js/network-visualization.js`:
```javascript
controls.autoRotateSpeed = 0.5;  // Change rotation speed
speed: 0.008 + Math.random() * 0.004  // Change particle speed
```

### Add Your Branding
Edit `index.html`:
```html
<h1>Your Name - Hybrid Siamese Network</h1>
```

## ✅ Checklist

- [ ] Created GitHub repository
- [ ] Pushed code to GitHub
- [ ] Enabled GitHub Pages in settings
- [ ] Waited 1-2 minutes for deployment
- [ ] Verified site is live
- [ ] Updated README with actual URL
- [ ] Shared your visualization!

## 🐛 Troubleshooting

### Site Not Loading?
- Wait 2-3 minutes after enabling Pages
- Check Settings → Pages for deployment status
- Ensure branch is `main` and folder is `/ (root)`

### 404 Error?
- Verify files are in root directory (not in a subfolder)
- Check that `index.html` exists at repository root
- Clear browser cache and try again

### JavaScript Not Working?
- Open browser DevTools (F12) and check Console
- Ensure Three.js CDN links are accessible
- Check if files are properly referenced in index.html

## 🌐 Custom Domain (Optional)

Want to use your own domain like `siamese.yourdomain.com`?

1. Add a file named `CNAME` in your repository:
   ```
   siamese.yourdomain.com
   ```

2. In your DNS settings, add a CNAME record:
   ```
   siamese.yourdomain.com → YOUR-USERNAME.github.io
   ```

3. In GitHub Settings → Pages, enter your custom domain

## 📱 Mobile Optimization

The visualization works on mobile devices with touch controls:
- Pinch to zoom
- Drag to rotate
- Auto-rotation is enabled by default

## 🎓 Resources

- [GitHub Pages Documentation](https://docs.github.com/en/pages)
- [Three.js Documentation](https://threejs.org/docs/)
- [Git Basics](https://git-scm.com/book/en/v2/Getting-Started-Git-Basics)

---

**Need help?** Open an issue on your repository or contact the community!

Good luck with your deployment! 🚀
