(function(){
  'use strict';
  function ready(fn){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',fn,{once:true});else fn();}
  function positionDashboardLayers(){
    var top=document.querySelector('.top');
    var tabs=document.querySelector('.spinCycleTabs');
    var decision=document.querySelector('.ownerDecisionWrap');
    if(!top)return;
    if(tabs)top.insertAdjacentElement('afterend',tabs);
    if(decision){
      if(tabs)tabs.insertAdjacentElement('afterend',decision);
      else top.insertAdjacentElement('afterend',decision);
    }
  }
  function makeSelect(id,labelText,options,onChange){
    var wrap=document.createElement('div');wrap.className='simpleSelectWrap';
    var label=document.createElement('label');label.className='simpleSelectLabel';label.htmlFor=id;label.textContent=labelText;
    var select=document.createElement('select');select.id=id;select.className='simpleSelect';
    options.forEach(function(o){var op=document.createElement('option');op.value=o.value;op.textContent=o.label;select.appendChild(op);});
    select.addEventListener('change',function(){onChange(select.value);});wrap.append(label,select);return {wrap:wrap,select:select};
  }
  function setupPeriodDropdown(){
    var periods=document.querySelector('.periods');if(!periods||document.getElementById('periodSelect'))return;
    var buttons=[].slice.call(periods.querySelectorAll('.period[data-period]'));if(!buttons.length)return;
    var ui=makeSelect('periodSelect','View',[{value:'today',label:'Today'},{value:'last_7_days',label:'Last 7 Days'},{value:'last_30_days',label:'Last 30 Days'}],function(value){var b=buttons.find(function(x){return x.dataset.period===value;});if(b)b.click();});
    periods.classList.add('simpleHidden');periods.parentNode.insertBefore(ui.wrap,periods);ui.select.value='today';
    var today=buttons.find(function(x){return x.dataset.period==='today';});if(today)today.click();
  }
  function setupCollectionsDropdown(){
    if(document.getElementById('collectionViewSelect'))return;
    var toggles=[].slice.call(document.querySelectorAll('.viewToggle'));
    var group=toggles.find(function(t){return t.querySelector('[data-view="collections-summary"]');});if(!group)return;
    var buttons=[].slice.call(group.querySelectorAll('button[data-view]'));
    var ui=makeSelect('collectionViewSelect','Collections View',[{value:'collections-summary',label:'Summary'},{value:'collections-graph',label:'Weekly'},{value:'collections-monthly',label:'Monthly'}],function(value){var b=buttons.find(function(x){return x.dataset.view===value;});if(b)b.click();});
    group.classList.add('simpleHidden');group.parentNode.insertBefore(ui.wrap,group);ui.select.value='collections-summary';
    var summary=buttons.find(function(x){return x.dataset.view==='collections-summary';});if(summary)summary.click();
  }
  function setupDecisionCard(){
    var eyebrow=document.querySelector('.decisionEyebrow');
    if(eyebrow)eyebrow.style.display='none';
    var btn=document.getElementById('decisionBtn');
    if(btn){
      btn.style.minWidth='220px';
      btn.style.fontSize='15px';
      btn.style.padding='14px 18px';
    }
  }
  function setupCompetitorWatch(){
    var section=document.querySelector('.compDash');if(!section)return;
    var intro=section.querySelector('.compDashHead p');
    if(intro)intro.textContent='Reference only. Your Dashboard combines your own data first, then uses competitor information only to help shape the plan.';
    [].slice.call(section.querySelectorAll('.compMini.action')).forEach(function(a){a.remove();});
    [].slice.call(section.querySelectorAll('.compDashActions')).forEach(function(row){
      var open=row.querySelector('.compMini');
      if(open){open.style.flex='1 1 100%';open.textContent='OPEN SITE';}
    });
  }
  ready(function(){positionDashboardLayers();setupPeriodDropdown();setupCollectionsDropdown();setupDecisionCard();setupCompetitorWatch();});
})();