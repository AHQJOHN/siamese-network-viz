# Hybrid Siamese Network 3D Visualization

An interactive 3D visualization of a Hybrid Siamese Network architecture for face recognition, combining VGGFace and FaceNet with Triplet and ArcFace loss functions.

🔗 **[Live Demo](https://ahqjohn.github.io/siamese-network-viz/)** 

![Network Architecture](siamese_network_visualization.gif)

## ✨ Features

- **Interactive 3D Visualization** - Rotate, zoom, and explore the network architecture
- **Animated Data Flow** - Watch particles flow through the network layers
- **Component Details** - Hover over blocks to see detailed specifications
- **Dual Loss Functions** - Visualize both Triplet Loss and ArcFace Loss
- **Hybrid Architecture** - See how VGGFace and FaceNet features are combined

## 🚀 Quick Start

### Deploy to GitHub Pages

1. **Create a new repository** on GitHub
2. **Push this code** to your repository
3. **Enable GitHub Pages** in Settings → Pages
4. **View live** at `https://YOUR-USERNAME.github.io/REPO-NAME/`

📖 See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for detailed instructions

### Run Locally

```bash
# Using Python
python -m http.server 8000

# Then visit http://localhost:8000
```

## 🏗️ Architecture

### Input Layer
- Triplet: Anchor, Positive, Negative (224×224×3 RGB)

### Feature Extractors
- **VGGFace (VGG-16)**: ~138M params, VGGFace2 dataset
- **FaceNet (Inception-ResNet-v1)**: ~23M params, CASIA-WebFace

### Fusion & Dense Layers
- Weighted concatenation → 4 FC layers → 512-d embedding

### Loss Functions
- **Triplet Loss**: margin α = 0.2
- **ArcFace Loss**: scale s = 64, margin m = 0.5

## 🎮 Controls

- **Drag**: Rotate view
- **Scroll**: Zoom
- **Hover**: Component details
- **Auto-rotate**: Enabled

## 🛠️ Technologies

- Three.js (r128)
- OrbitControls
- Vanilla JavaScript
- No build step required

## 📁 Project Structure

```
.
├── index.html                  # Main page
├── js/
│   └── network-visualization.js  # 3D vis code
├── siamese_network_visualization.gif
├── README.md
└── DEPLOYMENT_GUIDE.md
```

## 📖 References

- [VGGFace](https://www.robots.ox.ac.uk/~vgg/software/vgg_face/)
- [FaceNet Paper](https://arxiv.org/abs/1503.03832)
- [ArcFace Paper](https://arxiv.org/abs/1801.07698)

## 📄 License

MIT License

---

**Created with ❤️ using Three.js**
