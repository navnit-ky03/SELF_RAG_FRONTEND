# NeuroScan AI — authentic inference visualization assets

Source: User-provided screenshots / exported axial view from the NeuroScan AI Streamlit application (https://braintumorsegmentationmri.streamlit.app/) on 20 Oct 2026. Application shown connected to HF ZeroGPU with completed inference on demonstration input `BraTS20_Validation_001_flair.nii`.

## Images

- `neuroscan_axial_slice92.webp` — **complete** axial (top-down) slice, index 92, showing red predicted segmentation overlay; from later direct image provided by the user. Native source image is 240×240 pixels, so do not upscale aggressively or claim high-resolution output.
- `neuroscan_coronal_slice128.webp` — coronal (front–back) slice, index 128, mask opacity 0.65, cropped from the user's app screenshot.
- `neuroscan_sagittal_slice108.webp` — sagittal (side) slice, index 108, mask opacity 0.65, cropped from the user's app screenshot.

Images show **model-predicted segmentation overlays**, not ground truth; the red region is the inferred tumor mask. All images correspond to a single demo MRI, not an independently evaluated case or medical-grade diagnostic output. Do not treat these as clinical evidence or imply manual expert labels. Keep captions/source attribution and use static assets on the portfolio to avoid cold starts.

The separately shared app report for this scan displayed: `tumor_detected=true`, estimated segmented volume 122.51 cm³, burden 7.68%, peak axial slice 92, input dimensions 240×240×155 and spacing [1,1,1] mm. These are **individual inference outputs**, not validation results. The developer-reported best validation Dice is separately 0.8842; do not conflate them.

For the gallery, offer axial/coronal/sagittal tabs, descriptive alt text, and a prominent link to the live demo. Static image inspection should work without any backend request. Do not interpolate or generate additional synthetic slices or overlays.
