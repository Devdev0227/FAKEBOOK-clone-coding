// 첨부 미디어를 한 항목씩 표시하며, 방문한 항목만 지연 로드합니다.
(function (scope) {
    'use strict';
    function create({count, load, onChange = () => {}, label = '게시물 첨부 파일', document: suppliedDocument}) {
        const doc = suppliedDocument || document;
        const el = (tag, className) => { const node=doc.createElement(tag); if(className) node.className=className; return node; };
        const root=el('div','media-carousel'), stage=el('div','media-carousel-stage'), dots=el('div','media-carousel-dots'), status=el('p','media-carousel-status');
        root.setAttribute('role','region'); root.setAttribute('aria-roledescription','캐러셀'); root.setAttribute('aria-label',label); root.tabIndex=0;
        dots.setAttribute('role','group'); dots.setAttribute('aria-label','첨부 파일 위치');
        status.setAttribute('aria-live','polite'); status.setAttribute('aria-atomic','true');
        const slides=[], points=[], loaded=new Map(), pending=new Set(); let current=0, disposed=false;
        const pause = media => { if (media?.tagName?.toUpperCase()==='VIDEO') media.pause?.(); };
        const control=(text, action, className)=> { const node=el('button',className); node.type='button'; node.setAttribute('aria-label',text); node.title=text; node.addEventListener('click',action); return node; };
        const previous=control('이전 첨부 파일',()=>goTo(current-1),'media-carousel-arrow media-carousel-previous');
        const next=control('다음 첨부 파일',()=>goTo(current+1),'media-carousel-arrow media-carousel-next');
        function arrow(node, direction) {
            const ns='http://www.w3.org/2000/svg', svg=doc.createElementNS(ns,'svg'), path=doc.createElementNS(ns,'path');
            svg.setAttribute('viewBox','0 0 24 24'); svg.setAttribute('aria-hidden','true'); path.setAttribute('d', direction==='left'?'m15 5-7 7 7 7':'m9 5 7 7-7 7'); svg.append(path); node.append(svg);
        }
        arrow(previous,'left'); arrow(next,'right');
        for(let i=0;i<count;i++) {
            const slide=el('div','media-carousel-slide'); slide.setAttribute('role','group'); slide.setAttribute('aria-roledescription','슬라이드'); slide.setAttribute('aria-label',`${i+1} / ${count}`); slide.hidden=i!==0; slides.push(slide); stage.append(slide);
            const point=control(`${i+1}번째 첨부 파일 보기`,()=>goTo(i),'media-carousel-dot'); point.append(el('span')); points.push(point); dots.append(point);
        }
        previous.hidden=next.hidden=dots.hidden=count<=1;
        stage.append(previous,next); root.append(stage,dots,status);
        async function ensureLoaded(index) {
            if(disposed || loaded.has(index) || pending.has(index) || !slides[index]) return;
            pending.add(index);
            const placeholder=el('p','media-carousel-placeholder'); placeholder.textContent='첨부 파일을 불러오는 중…'; slides[index].replaceChildren(placeholder);
            try {
                if(disposed) return;
                const media=await load(index);
                if(disposed || !media) return;
                loaded.set(index,media); slides[index].replaceChildren(media);
                if(index!==current) pause(media);
                media.addEventListener('play',()=>{if(disposed || index!==current) pause(media);});
            } catch {
                if(!disposed) { placeholder.textContent='첨부 파일을 불러오지 못했습니다.'; slides[index].replaceChildren(placeholder); }
            } finally { pending.delete(index); }
        }
        function goTo(index) {
            if(disposed || !count || !Number.isFinite(index)) return;
            current=Math.max(0,Math.min(count-1,Math.floor(index)));
            slides.forEach((slide,i)=>{slide.hidden=i!==current; points[i].setAttribute('aria-pressed',String(i===current));});
            for(const [i,media] of loaded) if(i!==current) pause(media);
            previous.disabled=current===0; next.disabled=current===count-1;
            status.textContent=`첨부 파일 ${current+1} / ${count}`;
            onChange(current); void ensureLoaded(current);
        }
        root.addEventListener('keydown',event=> {
            if(event.target?.tagName?.toUpperCase()==='VIDEO') return;
            const keys={ArrowLeft:current-1,ArrowRight:current+1,Home:0,End:count-1};
            if(!(event.key in keys)) return; event.preventDefault(); goTo(keys[event.key]);
        });
        goTo(0);
        return {element:root, goTo, get currentIndex(){return current;}, dispose(){disposed=true; for(const media of loaded.values()) pause(media);}};
    }
    const api={create};
    if(typeof module!=='undefined' && module.exports) module.exports=api; else scope.FakebookCarousel=api;
})(typeof window!=='undefined'?window:globalThis);
