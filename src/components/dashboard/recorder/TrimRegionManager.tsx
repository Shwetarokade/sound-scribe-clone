
import RegionsPlugin from "wavesurfer.js/dist/plugins/regions.esm.js";

export class TrimRegionManager {
  private regionsPlugin: any;
  private onRegionUpdate: (region: { start: number; end: number }) => void;

  constructor(onRegionUpdate: (region: { start: number; end: number }) => void) {
    this.onRegionUpdate = onRegionUpdate;
    this.regionsPlugin = RegionsPlugin.create();
    
    this.regionsPlugin.on('region-updated', (region: any) => {
      this.onRegionUpdate({ start: region.start, end: region.end });
    });
  }

  getPlugin() {
    return this.regionsPlugin;
  }

  createTrimRegion(duration: number) {
    if (!this.regionsPlugin) return;

    // Clear existing regions
    this.regionsPlugin.clearRegions();
    
    const regionEnd = Math.min(15, duration);
    
    if (duration > 0) {
      const region = this.regionsPlugin.addRegion({
        start: 0,
        end: regionEnd,
        color: 'hsla(var(--primary) / 0.2)',
        resize: true,
        drag: true
      });
      
      this.onRegionUpdate({ start: 0, end: regionEnd });
    }
  }

  clearRegions() {
    if (this.regionsPlugin) {
      this.regionsPlugin.clearRegions();
    }
  }
}
