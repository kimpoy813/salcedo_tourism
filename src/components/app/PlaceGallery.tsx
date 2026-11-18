"use client";
import {useState} from "react";
import {ChevronLeft, ChevronRight, Expand, X} from "lucide-react";
import {Modal} from "@/components/ui/Modal";
import {GuideImage} from "./GuideImage";
import type {GuideImage as MediaItem} from "@/lib/visitor-media";

export function PlaceGallery({name, images}:{name:string;images:MediaItem[]}) {
  const [open,setOpen]=useState(false),[index,setIndex]=useState(0);
  const cover=images[0], image=images[Math.min(index,images.length-1)];
  if(!cover) return null;
  const change=(n:number)=>setIndex(i=>(i+n+images.length)%images.length);
  const kind=(i:MediaItem)=>i.kind==='illustration'?'Illustration':'Photo';
  return <>
    <figure className="place-artwork">
      <GuideImage src={cover.url} size="cover" width={1024} height={576} sizes="(max-width:780px) 100vw, 52vw" priority alt={cover.caption || `${kind(cover)} for ${name}`}/>
      <figcaption><span>{kind(cover)}{cover.kind==='photo' && cover.attribution && ` · ${cover.attribution}`}</span><button type="button" onClick={()=>{setIndex(0);setOpen(true)}}><Expand size={14}/>{images.length>1?`View gallery (${images.length})`:'View image'}</button></figcaption>
    </figure>
    {open && <Modal label={`Image gallery: ${name}`} className="lightbox-dialog" onClose={()=>setOpen(false)}>
      <div className="gallery-viewer" onKeyDown={e=>{if(e.key==='ArrowLeft'){e.preventDefault();change(-1)}if(e.key==='ArrowRight'){e.preventDefault();change(1)}}}>
        <div className="viewer-toolbar"><span>{name}</span><button type="button" onClick={()=>setOpen(false)} aria-label="Close gallery"><X size={21}/></button></div>
        <div className="viewer-stage"><GuideImage src={image.url} size="cover" fill sizes="100vw" alt={image.caption || `${kind(image)} for ${name}`}/></div>
        <div className="viewer-caption" aria-live="polite"><strong>{kind(image)} {index+1} of {images.length}</strong>{image.caption && <p>{image.caption}</p>}{image.attribution && <small>{image.attribution}</small>}</div>
        {images.length>1 && <div className="viewer-controls"><button aria-label="Previous image" onClick={()=>change(-1)}><ChevronLeft/></button><div className="viewer-thumbs">{images.map((v,i)=><button key={v.url} aria-label={`Show ${kind(v).toLowerCase()} ${i+1}`} aria-pressed={i===index} onClick={()=>setIndex(i)}><GuideImage src={v.url} size="thumb" width={72} height={45} alt=""/></button>)}</div><button aria-label="Next image" onClick={()=>change(1)}><ChevronRight/></button></div>}
      </div>
    </Modal>}
  </>;
}
