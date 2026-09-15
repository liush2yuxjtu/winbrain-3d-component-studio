"""OpenCV visual comparison at the original pixel coordinates; no registration or warping."""
import cv2,numpy as np,json,sys,hashlib
from pathlib import Path
root=Path(__file__).resolve().parents[1]
refpath=root/'assets/reference.png';ref=cv2.imread(str(refpath))
regions={'whole':[0,0,1536,1024],'header':[0,0,1536,90],'hero':[0,125,322,495],'apps':[445,100,1110,257],'application_platform':[325,200,1217,369],'intelligence':[315,351,1220,637],'data_foundation':[280,594,1240,882],'earth':[140,863,1380,1024],'sidebar':[1245,120,1536,853]}

def ssim_map(a,b):
 a=cv2.cvtColor(a,cv2.COLOR_BGR2GRAY).astype(np.float32);b=cv2.cvtColor(b,cv2.COLOR_BGR2GRAY).astype(np.float32)
 mu1=cv2.GaussianBlur(a,(11,11),1.5);mu2=cv2.GaussianBlur(b,(11,11),1.5)
 aa=cv2.GaussianBlur(a*a,(11,11),1.5)-mu1*mu1;bb=cv2.GaussianBlur(b*b,(11,11),1.5)-mu2*mu2;ab=cv2.GaussianBlur(a*b,(11,11),1.5)-mu1*mu2
 return ((2*mu1*mu2+6.5025)*(2*ab+58.5225))/((mu1*mu1+mu2*mu2+6.5025)*(aa+bb+58.5225))

def compare(file):
 current=cv2.imread(str(file));assert current is not None and current.shape==ref.shape,(file,current.shape if current is not None else None)
 diff=cv2.absdiff(ref,current);smooth=cv2.absdiff(cv2.GaussianBlur(ref,(0,0),3),cv2.GaussianBlur(current,(0,0),3));ssim=ssim_map(ref,current)
 edges=[cv2.Canny(cv2.cvtColor(x,cv2.COLOR_BGR2GRAY),50,130) for x in [ref,current]]
 distances=[cv2.distanceTransform(255-e,cv2.DIST_L2,3) for e in edges]
 result={'capture':str(file.relative_to(root)),'opencv':cv2.__version__,'canvas':[1536,1024],'registration':'none; identical pixel coordinates','reference_sha256':hashlib.sha256(refpath.read_bytes()).hexdigest(),'capture_sha256':hashlib.sha256(file.read_bytes()).hexdigest(),'regions':{}}
 for name,(x1,y1,x2,y2) in regions.items():
  sl=np.s_[y1:y2,x1:x2];rgray=cv2.cvtColor(ref[sl],cv2.COLOR_BGR2GRAY);cgray=cv2.cvtColor(current[sl],cv2.COLOR_BGR2GRAY)
  er=edges[0][sl]>0;ec=edges[1][sl]>0
  result['regions'][name]={'rect':[x1,y1,x2-x1,y2-y1],'mae_rgb':round(float(diff[sl].mean()),4),'blurred_mae':round(float(smooth[sl].mean()),4),'ssim_gray':round(float(ssim[sl].mean()),5),'reference_luma':round(float(rgray.mean()),2),'capture_luma':round(float(cgray.mean()),2),'edge_distance_px':round(float((np.minimum(distances[1][sl][er],30).mean()+np.minimum(distances[0][sl][ec],30).mean())/2),3)}
 stem=file.with_suffix('');Path(str(stem)+'-metrics.json').write_text(json.dumps(result,indent=2))
 magnitude=smooth.mean(2);heat=cv2.applyColorMap(np.clip(magnitude*3,0,255).astype(np.uint8),cv2.COLORMAP_INFERNO);cv2.imwrite(str(stem)+'-heatmap.png',heat)
 cv2.imwrite(str(stem)+'-overlay.png',cv2.addWeighted(ref,.5,current,.5,0))
 edge=np.zeros_like(ref);edge[edges[0]>0]=(255,210,40);edge[edges[1]>0]=(0,110,255);edge[(edges[0]>0)&(edges[1]>0)]=(245,245,245);cv2.imwrite(str(stem)+'-edges.png',edge)
 print(json.dumps({name:v for name,v in result['regions'].items()},indent=2))
 return result
if __name__=='__main__':
 for value in sys.argv[1:]:compare((root/value).resolve())
