// Menu.js v3.3.0

//---------------------------------------------------------------------------
// ★Menuクラス [ファイル]等のメニューの動作を設定する
//---------------------------------------------------------------------------
Caption = function(){
	this.menu     = '';
	this.label    = '';
};
MenuData = function(strJP, strEN){
	this.caption = { ja: strJP, en: strEN};
	this.smenus = [];
};

// メニュー描画/取得/html表示系
// Menuクラス
Menu = function(){
	this.dispfloat  = [];			// 現在表示しているフロートメニューウィンドウ(オブジェクト)
	this.floatpanel = [];			// (2段目含む)フロートメニューオブジェクトのリスト
	this.pop        = "";			// 現在表示しているポップアップウィンドウ(オブジェクト)

	this.movingpop  = "";			// 移動中のポップアップメニュー
	this.offset = new Pos(0, 0);	// ポップアップウィンドウの左上からの位置

	this.btnstack   = [];			// ボタンの情報(idnameと文字列のリスト)
	this.labelstack = [];			// span等の文字列の情報(idnameと文字列のリスト)

	this.ex = new MenuExec();
	this.ex.init();

	this.language = 'ja';

	this.ispencilbox = (k.isKanpenExist && (k.puzzleid!=="nanro" && k.puzzleid!=="ayeheya" && k.puzzleid!=="kurochute"));

	// ElementTemplate : メニュー領域
	var menu_funcs = {mouseover : ee.ebinder(this, this.menuhover), mouseout  : ee.ebinder(this, this.menuout)};
	this.EL_MENU  = ee.addTemplate('menupanel','li', {className:'menu'}, null, menu_funcs);

	// ElementTemplate : フロートメニュー
	var float_funcs = {mouseout:ee.ebinder(this, this.floatmenuout)};
	this.EL_FLOAT = ee.addTemplate('float_parent','menu', {className:'floatmenu'}, {backgroundColor:base.floatbgcolor}, float_funcs);

	// ElementTemplate : フロートメニュー(中身)
	var smenu_funcs  = {mouseover: ee.ebinder(this, this.submenuhover), mouseout: ee.ebinder(this, this.submenuout), click:ee.ebinder(this, this.submenuclick)};
	var select_funcs = {mouseover: ee.ebinder(this, this.submenuhover), mouseout: ee.ebinder(this, this.submenuout)};
	this.EL_SMENU    = ee.addTemplate('','li', {className:'smenu'}, null, smenu_funcs);
	this.EL_SPARENT  = ee.addTemplate('','li', {className:'smenu'}, null, select_funcs);
	this.EL_SELECT   = ee.addTemplate('','li', {className:'smenu'}, {fontWeight :'900', fontSize:'10pt'}, select_funcs);
	this.EL_SEPARATE = ee.addTemplate('','li', {className:'smenusep', innerHTML:'&nbsp;'}, null, null);
	this.EL_CHECK    = ee.addTemplate('','li', {className:'smenu'}, {paddingLeft:'6pt', fontSize:'10pt'}, smenu_funcs);
	this.EL_LABEL    = ee.addTemplate('','li', {className:'smenulabel'}, null, null);
	this.EL_CHILD = this.EL_CHECK;

	// ElementTemplate : 管理領域
	this.EL_DIVPACK  = ee.addTemplate('','div',  null, null, null);
	this.EL_SPAN     = ee.addTemplate('','span', {unselectable:'on'}, null, null);
	this.EL_CHECKBOX = ee.addTemplate('','input',{type:'checkbox', check:''}, null, {click:ee.ebinder(this, this.checkclick)});
	this.EL_SELCHILD = ee.addTemplate('','div',  {className:'flag',unselectable:'on'}, null, {click:ee.ebinder(this, this.selectclick)});

	// ElementTemplate : ボタン
	this.EL_BUTTON = ee.addTemplate('','input', {type:'button'}, null, null);
	this.EL_UBUTTON = ee.addTemplate('btnarea','input', {type:'button'}, null, null);
};
Menu.prototype = {
	//---------------------------------------------------------------------------
	// menu.menuinit()   メニュー、サブメニュー、フロートメニュー、ボタン、
	//                   管理領域、ポップアップメニューの初期設定を行う
	// menu.menureset()  メニュー用の設定を消去する
	//
	// menu.addButtons() ボタンの情報を変数に登録する
	// menu.addLabels()  ラベルの情報を変数に登録する
	//---------------------------------------------------------------------------
	menuinit : function(){
		this.menuarea();
		this.managearea();
		this.poparea();

		this.displayAll();
	},

	menureset : function(){
		this.dispfloat  = [];
		this.floatpanel = [];
		this.pop        = "";
		this.btnstack   = [];
		this.labelstack = [];
		this.managestack = [];

		this.popclose();
		this.menuclear();
		this.floatmenuclose(0);

		ee('float_parent').el.innerHTML = '';

		if(!!ee('btncolor2')){ ee('btncolor2').remove();}
		ee('btnarea').removeNextAll(ee('btnclear2').el);

		ee('urlbuttonarea').el.innerHTML = '';

		ee('menupanel') .el.innerHTML = '';
		ee('usepanel')  .el.innerHTML = '';
		ee('checkpanel').el.innerHTML = '';

		pp.reset();
	},

	addButtons : function(el, func, strJP, strEN){
		if(!!func) el.onclick = func;
		ee(el).unselectable();
		this.btnstack.push({el:el, str:{ja:strJP, en:strEN}});
	},
	addLabels  : function(el, strJP, strEN){
		this.labelstack.push({el:el, str:{ja:strJP, en:strEN}});
	},

	//---------------------------------------------------------------------------
	// menu.displayAll() 全てのメニュー、ボタン、ラベルに対して文字列を設定する
	// menu.setdisplay() 管理パネルとサブメニューに表示する文字列を個別に設定する
	//---------------------------------------------------------------------------
	displayAll : function(){
		for(var i in pp.flags){ this.setdisplay(i);}
		for(var i=0,len=this.btnstack.length;i<len;i++){
			if(!this.btnstack[i].el){ continue;}
			this.btnstack[i].el.value = this.btnstack[i].str[menu.language];
		}
		for(var i=0,len=this.labelstack.length;i<len;i++){
			if(!this.labelstack[i].el){ continue;}
			this.labelstack[i].el.innerHTML = this.labelstack[i].str[menu.language];
		}
	},
	setdisplay : function(idname){
		switch(pp.type(idname)){
		case pp.MENU:
			var menu = ee('ms_'+idname);
			if(!!menu){ menu.el.innerHTML = "["+pp.getMenuStr(idname)+"]";}
			break;

		case pp.SMENU: case pp.LABEL: case pp.SPARENT:
			var smenu = ee('ms_'+idname);
			if(!!smenu){ smenu.el.innerHTML = pp.getMenuStr(idname);}
			break;

		case pp.SELECT:
			var smenu = ee('ms_'+idname), label = ee('cl_'+idname);
			if(!!smenu){ smenu.el.innerHTML = "&nbsp;"+pp.getMenuStr(idname);}	// メニュー上の表記の設定
			if(!!label){ label.el.innerHTML = pp.getLabel(idname);}			// 管理領域上の表記の設定
			for(var i=0,len=pp.flags[idname].child.length;i<len;i++){ this.setdisplay(""+idname+"_"+pp.flags[idname].child[i]);}
			break;

		case pp.CHILD:
			var smenu = ee('ms_'+idname), manage = ee('up_'+idname);
			var issel = (pp.getVal(idname) == pp.getVal(pp.flags[idname].parent));
			var cap = pp.getMenuStr(idname);
			if(!!smenu){ smenu.el.innerHTML = (issel?"+":"&nbsp;")+cap;}	// メニューの項目
			if(!!manage){													// 管理領域の項目
				manage.el.innerHTML = cap;
				manage.el.className = (issel?"childsel":"child");
			}
			break;

		case pp.CHECK:
			var smenu = ee('ms_'+idname), check = ee('ck_'+idname), label = ee('cl_'+idname);
			var flag = pp.getVal(idname);
			if(!!smenu){ smenu.el.innerHTML = (flag?"+":"&nbsp;")+pp.getMenuStr(idname);}	// メニュー
			if(!!check){ check.el.checked   = flag;}					// 管理領域(チェックボックス)
			if(!!label){ label.el.innerHTML = pp.getLabel(idname);}		// 管理領域(ラベル)
			break;
		}
	},

//--------------------------------------------------------------------------------------------------------------

	//---------------------------------------------------------------------------
	// menu.menuarea()   メニューの初期設定を行う
	//---------------------------------------------------------------------------
	menuarea : function(){
		var am = ee.binder(pp, pp.addMenu),
			at = ee.binder(pp, pp.addSParent),
			as = ee.binder(pp, pp.addSmenu),
			au = ee.binder(pp, pp.addSelect),
			ac = ee.binder(pp, pp.addCheck),
			aa = ee.binder(pp, pp.addCaption),
			ai = ee.binder(pp, pp.addChild),
			ap = ee.binder(pp, pp.addSeparator),
			af = ee.binder(pp, pp.addFlagOnly),
			sl = ee.binder(pp, pp.setLabel);

		// *ファイル ==========================================================
		am('file', "ファイル", "File");

		as('newboard', 'file', '新規作成','New Board');
		as('urlinput', 'file', 'URL入力', 'Import from URL');
		as('urloutput','file', 'URL出力', 'Export URL');
		ap('sep_file', 'file');
		as('fileopen', 'file', 'ファイルを開く','Open the file');
		at('filesavep', 'file', 'ファイル保存 ->',  'Save the file as ... ->');
		if(fio.dbm.DBaccept>0){
			as('database',  'file', '一時保存/戻す', 'Temporary Stack');
		}
		if(base.enableSaveImage){
			ap('sep_image', 'file');
			at('imagesavep', 'file', '画像を保存 ->', 'Save as image file');
		}

		// *ファイル - ファイル保存 -------------------------------------------
		as('filesave',  'filesavep', 'ぱずぷれv3形式',  'Puz-Pre v3 format');
		if(this.ispencilbox){
			as('filesave2', 'filesavep', 'pencilbox形式', 'Pencilbox format');
		}

		// *ファイル - 画像を保存 -------------------------------------------
		if(base.enableSaveImage){
			as('imagedl',   'imagesavep', '画像をダウンロード', 'Download the image');
			as('imagesave', 'imagesavep', '別ウィンドウで開く', 'Open another window');
		}

		// *編集 ==============================================================
		am('edit', "編集", "Edit");

		as('adjust', 'edit', '盤面の調整', 'Adjust the Board');
		as('turn',   'edit', '反転・回転', 'Filp/Turn the Board');

		// *表示 ==============================================================
		am('disp', "表示", "Display");

		au('size','disp',2,[0,1,2,3,4], '表示サイズ','Cell Size');
		ap('sep_disp1',  'disp');

		if(!!k.irowake){
			ac('irowake','disp',(k.irowake==2?true:false),'線の色分け','Color coding');
			sl('irowake', '線の色分けをする', 'Color each lines');
		}
		ac('cursor','disp',true,'カーソルの表示','Display cursor');
		ap('sep_disp2', 'disp');
		as('repaint', 'disp', '盤面の再描画', 'Repaint whole board');
		as('manarea', 'disp', '管理領域を隠す', 'Hide Management Area');

		// *表示 - 表示サイズ -------------------------------------------------
		as('dispsize',    'size','サイズ指定','Cell Size');
		aa('cap_dispmode','size','表示モード','Display mode');
		ai('size_0', 'size', 'サイズ 極小', 'Ex Small');
		ai('size_1', 'size', 'サイズ 小',   'Small');
		ai('size_2', 'size', 'サイズ 標準', 'Normal');
		ai('size_3', 'size', 'サイズ 大',   'Large');
		ai('size_4', 'size', 'サイズ 特大', 'Ex Large');
		ap('sep_size', 'size');
		ac('adjsize', 'size', true, 'サイズの自動調節', 'Auto Adjustment');

		// *設定 ==============================================================
		am('setting', "設定", "Setting");

		if(k.EDITOR){
			au('mode','setting',(k.editmode?1:3),[1,3],'モード', 'mode');
			sl('mode','モード', 'mode');
		}
		else{
			af('mode', 3);
		}

		puz.menufix();	// 各パズルごとのメニュー追加

		ac('autocheck','setting', k.playmode, '正答自動判定', 'Auto Answer Check');
		ac('lrcheck',  'setting', false, 'マウス左右反転', 'Mouse button inversion');
		sl('lrcheck', 'マウスの左右ボタンを反転する', 'Invert button of the mouse');
		if(kp.ctl[1].enable || kp.ctl[3].enable){
			ac('keypopup', 'setting', kp.defaultdisp, 'パネル入力', 'Panel inputting');
			sl('keypopup', '数字・記号をパネルで入力する', 'Input numbers by panel');
		}
		au('language', 'setting', 0,[0,1], '言語', 'Language');

		// *設定 - モード -----------------------------------------------------
		ai('mode_1', 'mode', '問題作成モード', 'Edit mode'  );
		ai('mode_3', 'mode', '回答モード',     'Answer mode');

		// *設定 - 言語 -------------------------------------------------------
		ai('language_0', 'language', '日本語',  '日本語');
		ai('language_1', 'language', 'English', 'English');

		// *その他 ============================================================
		am('other', "その他", "Others");

		as('credit',  'other', 'ぱずぷれv3について',   'About PUZ-PRE v3');
		ap('sep_other','other');
		at('link',     'other', 'リンク', 'Link');
		// *その他 - リンク -----------------------------------------------------
		as('jumpv3',  'link', 'ぱずぷれv3のページへ', 'Jump to PUZ-PRE v3 page');
		as('jumptop', 'link', '連続発破保管庫TOPへ',  'Jump to indi.s58.xrea.com');
		as('jumpblog','link', 'はっぱ日記(blog)へ',   'Jump to my blog');

		this.createAllFloat();
	},

	//---------------------------------------------------------------------------
	// menu.addUseToFlags()       「操作方法」サブメニュー登録用共通関数
	// menu.addRedLineToFlags()   「線のつながりをチェック」サブメニュー登録用共通関数
	// menu.addRedBlockToFlags()  「黒マスのつながりをチェック」サブメニュー登録用共通関数
	// menu.addRedBlockRBToFlags()「ナナメ黒マスのつながりをチェック」サブメニュー登録用共通関数
	//---------------------------------------------------------------------------
	addUseToFlags : function(){
		pp.addSelect('use','setting',1,[1,2], '操作方法', 'Input Type');
		pp.setLabel ('use', '操作方法', 'Input Type');

		pp.addChild('use_1','use','左右ボタン','LR Button');
		pp.addChild('use_2','use','1ボタン',   'One Button');
	},
	addRedLineToFlags : function(){
		pp.addCheck('dispred','setting',false,'繋がりチェック','Continuous Check');
		pp.setLabel('dispred', '線のつながりをチェックする', 'Check countinuous lines');
	},
	addRedBlockToFlags : function(){
		pp.addCheck('dispred','setting',false,'繋がりチェック','Continuous Check');
		pp.setLabel('dispred', '黒マスのつながりをチェックする', 'Check countinuous black cells');
	},
	addRedBlockRBToFlags : function(){
		pp.addCheck('dispred','setting',false,'繋がりチェック','Continuous Check');
		pp.setLabel('dispred', 'ナナメ黒マスのつながりをチェックする', 'Check countinuous black cells with its corner');
	},

	//---------------------------------------------------------------------------
	// menu.createAllFloat() 登録されたサブメニューから全てのフロートメニューを作成する
	// menu.csshack_forIE6() セパレータのstyleを変更する
	//---------------------------------------------------------------------------
	createAllFloat : function(){
		var _IE6 = false;
		if(navigator.userAgent.match(/MSIE (\d+)/)){
			if(parseInt(RegExp.$1)<=7){ _IE6=true;}
		}

		for(var i=0;i<pp.flaglist.length;i++){
			var id = pp.flaglist[i];
			if(!pp.flags[id]){ continue;}

			var smenu, smenuid = 'ms_'+id;
			switch(pp.type(id)){
				case pp.MENU:     smenu = ee.createEL(this.EL_MENU,    smenuid); continue; break;
				case pp.SEPARATE: smenu = ee.createEL(this.EL_SEPARATE,smenuid); if(_IE6){ this.csshack_forIE6(smenu);} break;
				case pp.LABEL:    smenu = ee.createEL(this.EL_LABEL,   smenuid); break;
				case pp.SELECT:   smenu = ee.createEL(this.EL_SELECT,  smenuid); break;
				case pp.SMENU:    smenu = ee.createEL(this.EL_SMENU,   smenuid); break;
				case pp.CHECK:    smenu = ee.createEL(this.EL_CHECK,   smenuid); break;
				case pp.CHILD:    smenu = ee.createEL(this.EL_CHILD,   smenuid); break;
				case pp.SPARENT:
					var dispnormal = (pp.getMenuStr(id).indexOf("->")>=0);
					smenu = ee.createEL((dispnormal ? this.EL_SPARENT : this.EL_SELECT), smenuid);
					break;
				default: continue; break;
			}

			var parentid = pp.flags[id].parent;
			if(!this.floatpanel[parentid]){
				this.floatpanel[parentid] = ee.createEL(this.EL_FLOAT, 'float_'+parentid);
			}
			this.floatpanel[parentid].appendChild(smenu);
		}

		// 'setting'だけはセパレータを後から挿入する
		var el = ee('float_setting').el, fw = el.firstChild.style.fontWeight
		for(var i=1,len=el.childNodes.length;i<len;i++){
			var node = el.childNodes[i];
			if(fw!=node.style.fontWeight){
				var smenu = ee.createEL(this.EL_SEPARATE,''); if(_IE6){ this.csshack_forIE6(smenu);}
				ee(smenu).insertBefore(node);
				i++; len++; // 追加したので1たしておく
			}
			fw=node.style.fontWeight;
		}

		// その他の調整
		if(k.PLAYER){
			ee('ms_newboard') .el.className = 'smenunull';
			ee('ms_urloutput').el.className = 'smenunull';
			ee('ms_adjust')   .el.className = 'smenunull';
		}
		ee('ms_jumpv3')  .el.style.fontSize = '10pt'; ee('ms_jumpv3')  .el.style.paddingLeft = '8pt';
		ee('ms_jumptop') .el.style.fontSize = '10pt'; ee('ms_jumptop') .el.style.paddingLeft = '8pt';
		ee('ms_jumpblog').el.style.fontSize = '10pt'; ee('ms_jumpblog').el.style.paddingLeft = '8pt';
	},
	// IE7以下向けのCSSハックをやめて、ここで設定するようにした
	csshack_forIE6 : function(smenu){
		if(smenu.className == 'smenusep'){
			smenu.style.lineHeight = '2pt';
			smenu.style.display = 'inline';
		}
	},

	//---------------------------------------------------------------------------
	// menu.menuhover(e) メニューにマウスが乗ったときの表示設定を行う
	// menu.menuout(e)   メニューからマウスが外れた時の表示設定を行う
	// menu.menuclear()  メニュー/サブメニュー/フロートメニューを全て選択されていない状態に戻す
	//---------------------------------------------------------------------------
	menuhover : function(e){
		if(!!this.movingpop){ return true;}

		var idname = ee.getSrcElement(e).id.substr(3);
		this.floatmenuopen(e,idname,0);
		ee('menupanel').replaceChildrenClass('menusel','menu');
		ee.getSrcElement(e).className = "menusel";
	},
	menuout   : function(e){
		if(!this.insideOfMenu(e)){
			this.menuclear();
			this.floatmenuclose(0);
		}
	},
	menuclear : function(){
		ee('menupanel').replaceChildrenClass('menusel','menu');
	},

	//---------------------------------------------------------------------------
	// menu.submenuhover(e) サブメニューにマウスが乗ったときの表示設定を行う
	// menu.submenuout(e)   サブメニューからマウスが外れたときの表示設定を行う
	// menu.submenuclick(e) 通常/選択型/チェック型サブメニューがクリックされたときの動作を実行する
	//---------------------------------------------------------------------------
	submenuhover : function(e){
		var idname = ee.getSrcElement(e).id.substr(3);
		if(ee.getSrcElement(e).className==="smenu"){ ee.getSrcElement(e).className="smenusel";}
		if(pp.flags[idname] && (pp.type(idname)===pp.SELECT || pp.type(idname)===pp.SPARENT)){
			if(ee.getSrcElement(e).className!=='smenunull'){
				this.floatmenuopen(e,idname,this.dispfloat.length);
			}
		}
	},
	submenuout   : function(e){
		var idname = ee.getSrcElement(e).id.substr(3);
		if(ee.getSrcElement(e).className==="smenusel"){ ee.getSrcElement(e).className="smenu";}
		if(pp.flags[idname] && (pp.type(idname)===pp.SELECT || pp.type(idname)===pp.SPARENT)){
			this.floatmenuout(e);
		}
	},
	submenuclick : function(e){
		var idname = ee.getSrcElement(e).id.substr(3);
		if(ee.getSrcElement(e).className==="smenunull"){ return;}
		this.menuclear();
		this.floatmenuclose(0);

		switch(pp.type(idname)){
			case pp.SMENU: this.popopen(e, idname); break;
			case pp.CHILD: pp.setVal(pp.flags[idname].parent, pp.getVal(idname)); break;
			case pp.CHECK: pp.setVal(idname, !pp.getVal(idname)); break;
		}
	},

	//---------------------------------------------------------------------------
	// menu.floatmenuopen()  マウスがメニュー項目上に来た時にフロートメニューを表示する
	// menu.floatmenuclose() フロートメニューをcloseする
	// menu.floatmenuout(e)  マウスがフロートメニューを離れた時にフロートメニューをcloseする
	// menu.insideOf()       イベントeがエレメントの範囲内で起こったか？
	// menu.insideOfMenu()   マウスがメニュー領域の中にいるか判定する
	//---------------------------------------------------------------------------
	floatmenuopen : function(e, idname, depth){
		if(depth===0){ this.menuclear();}
		this.floatmenuclose(depth);

		if(depth>0 && !this.dispfloat[depth-1]){ return;}

		var rect = ee(ee.getSrcElement(e).id).getRect();
		var _float = this.floatpanel[idname];
		if(depth==0){
			_float.style.left = rect.left   + 1 + 'px';
			_float.style.top  = rect.bottom + 1 + 'px';
		}
		else{
			if(!k.br.IEmoz4){
				_float.style.left = rect.right - 3 + 'px';
				_float.style.top  = rect.top   - 3 + 'px';
			}
			else{
				_float.style.left = ee.pageX(e)  + 'px';
				_float.style.top  = rect.top - 3 + 'px';
			}
		}
		_float.style.zIndex   = 101+depth;
		_float.style.display  = 'block';

		this.dispfloat.push(_float);
	},
	// マウスが離れたときにフロートメニューをクローズする
	// フロート->メニュー側に外れた時は、関数終了直後にfloatmenuopen()が呼ばれる
	floatmenuclose : function(depth){
		for(var i=this.dispfloat.length-1;i>=depth;i--){
			if(i!==0){
				var parentsmenuid = "ms_" + this.dispfloat[i].id.substr(6);
				ee(parentsmenuid).el.className = 'smenu';
			}
			this.dispfloat[i].style.display = 'none';
			this.dispfloat.pop();
		}
	},

	floatmenuout : function(e){
		for(var i=this.dispfloat.length-1;i>=0;i--){
			if(this.insideOf(this.dispfloat[i],e)){
				this.floatmenuclose(i+1);
				return;
			}
		}
		// ここに来るのはすべて消える場合
		this.menuclear();
		this.floatmenuclose(0);
	},

	insideOf : function(el, e){
		var ex = ee.pageX(e);
		var ey = ee.pageY(e);
		var rect = ee(el.id).getRect();
		return (ex>=rect.left && ex<=rect.right && ey>=rect.top && ey<=rect.bottom);
	},
	insideOfMenu : function(e){
		var ex = ee.pageX(e);
		var ey = ee.pageY(e);
		var rect_f = ee('ms_file').getRect(), rect_o = ee('ms_other').getRect();
		return (ex>=rect_f.left && ex<=rect_o.right && ey>=rect_f.top);
	},

//--------------------------------------------------------------------------------------------------------------

	//---------------------------------------------------------------------------
	// menu.managearea()   管理領域の初期化を行う(内容はサブメニューのものを参照)
	// menu.checkclick()   管理領域のチェックボタンが押されたとき、チェック型の設定を設定する
	// menu.selectclick()  選択型サブメニュー項目がクリックされたときの動作
	//---------------------------------------------------------------------------
	managearea : function(){
		// usearea & checkarea
		for(var n=0;n<pp.flaglist.length;n++){
			var idname = pp.flaglist[n];
			if(!pp.flags[idname] || !pp.getLabel(idname)){ continue;}
			var _div = ee(ee.createEL(this.EL_DIVPACK,'div_'+idname));
			//_div.el.innerHTML = "";

			switch(pp.type(idname)){
			case pp.SELECT:
				_div.appendEL(ee.createEL(this.EL_SPAN, 'cl_'+idname));
				_div.appendHTML("&nbsp;|&nbsp;");
				for(var i=0;i<pp.flags[idname].child.length;i++){
					var num = pp.flags[idname].child[i];
					_div.appendEL(ee.createEL(this.EL_SELCHILD, ['up',idname,num].join("_")));
					_div.appendHTML('&nbsp;');
				}
				_div.appendBR();

				ee('usepanel').appendEL(_div.el);
				break;

			case pp.CHECK:
				_div.appendEL(ee.createEL(this.EL_CHECKBOX, 'ck_'+idname));
				_div.appendHTML("&nbsp;");
				_div.appendEL(ee.createEL(this.EL_SPAN, 'cl_'+idname));
				_div.appendBR();

				ee('checkpanel').appendEL(_div.el);
				break;
			}
		}

		// 色分けチェックボックス用の処理
		if(k.irowake){
			// 横にくっつけたいボタンを追加
			var el = ee.createEL(this.EL_BUTTON, 'ck_btn_irowake');
			this.addButtons(el, ee.binder(menu.ex, menu.ex.irowakeRemake), "色分けしなおす", "Change the color of Line");
			ee('ck_btn_irowake').insertAfter(ee('cl_irowake').el);

			// 色分けのやつを一番下に持ってくる
			var el = ee('checkpanel').el.removeChild(ee('div_irowake').el);
			ee('checkpanel').el.appendChild(el);
		}

		// 左上に出てくるやつ
		ee('translation').unselectable().el.onclick = ee.binder(this, this.translate);
		this.addLabels(ee('translation').el, "English", "日本語");

		// 説明文の場所
		ee('expression').el.innerHTML = base.expression.ja;

		// 管理領域の表示/非表示設定
		if(k.EDITOR){
			ee('timerpanel').el.style.display = 'none';
			ee('separator2').el.style.display = 'none';
		}
		if(!!ee('ck_keypopup')){ pp.funcs.keypopup();}

		// (Canvas下) ボタンの初期設定
		ee.createEL(this.EL_UBUTTON, 'btncheck');
		ee('btnarea').appendHTML('&nbsp;');
		ee.createEL(this.EL_UBUTTON, 'btnundo');
		ee.createEL(this.EL_UBUTTON, 'btnredo');
		ee('btnarea').appendHTML('&nbsp;');
		ee.createEL(this.EL_UBUTTON, 'btnclear');
		ee.createEL(this.EL_UBUTTON, 'btnclear2');

		this.addButtons(ee("btncheck").el,  ee.binder(ans, ans.check),             "チェック", "Check");
		this.addButtons(ee("btnundo").el,   ee.binder(um, um.undo),                "戻",       "<-");
		this.addButtons(ee("btnredo").el,   ee.binder(um, um.redo),                "進",       "->");
		this.addButtons(ee("btnclear").el,  ee.binder(menu.ex, menu.ex.ACconfirm), "回答消去", "Erase Answer");
		this.addButtons(ee("btnclear2").el, ee.binder(menu.ex, menu.ex.ASconfirm), "補助消去", "Erase Auxiliary Marks");

		if(k.irowake!=0){
			var el = ee.createEL(this.EL_BUTTON, 'btncolor2');
			this.addButtons(el, ee.binder(menu.ex, menu.ex.irowakeRemake), "色分けしなおす", "Change the color of Line");
			ee('btncolor2').insertAfter(ee('btnclear2').el).el.style.display = 'none';
		}
	},

	checkclick : function(e){
		var el = ee.getSrcElement(e);
		var idname = el.id.substr(3);
		pp.setVal(idname, !!el.checked);
	},
	selectclick : function(e){
		var list = ee.getSrcElement(e).id.split('_');
		pp.setVal(list[1], list[2]);
	},

//--------------------------------------------------------------------------------------------------------------

	//---------------------------------------------------------------------------
	// menu.poparea()       ポップアップメニューの初期設定を行う
	//---------------------------------------------------------------------------
	poparea : function(){

		//=====================================================================
		//// 各タイトルバーの動作設定
		var pop = ee('popup_parent').el.firstChild;
		while(!!pop){
			var _el = pop.firstChild;
			while(!!_el){
				if(_el.className==='titlebar'){
					this.titlebarfunc(_el);
					break;
				}
				_el = _el.nextSibling;
			}
			pop = pop.nextSibling;
		}
		this.titlebarfunc(ee('credit3_1').el);

		document.onmousemove = ee.ebinder(this,this.titlebarmove);
		document.onmouseup   = ee.ebinder(this,this.titlebarup);

		//=====================================================================
		//// formボタンの動作設定・その他のCaption設定
		var btn = ee.binder(this, this.addButtons);
		var lab = ee.binder(this, this.addLabels);
		var close = ee.ebinder(this, this.popclose);
		var func = null;

		// 盤面の新規作成 -----------------------------------------------------
		func = ee.ebinder(this.ex, this.ex.newboard);
		lab(ee('bar1_1').el,      "盤面の新規作成",         "Createing New Board");
		lab(ee('pop1_1_cap0').el, "盤面を新規作成します。", "Create New Board.");
		if(k.puzzleid!=='sudoku' && k.puzzleid!=='tawa'){
			lab(ee('pop1_1_cap1').el, "よこ",                   "Cols");
			lab(ee('pop1_1_cap2').el, "たて",                   "Rows");
		}
		btn(document.newboard.newboard, func,  "新規作成",   "Create");
		btn(document.newboard.cancel,   close, "キャンセル", "Cancel");

		// URL入力 ------------------------------------------------------------
		func = ee.ebinder(this.ex, this.ex.urlinput);
		lab(ee('bar1_2').el,      "URL入力",                     "Import from URL");
		lab(ee('pop1_2_cap0').el, "URLから問題を読み込みます。", "Import a question from URL.");
		btn(document.urlinput.urlinput, func,  "読み込む",   "Import");
		btn(document.urlinput.cancel,   close, "キャンセル", "Cancel");

		// URL出力 ------------------------------------------------------------
		func = ee.ebinder(this.ex, this.ex.urloutput);
		lab(ee('bar1_3').el, "URL出力", "Export URL");
		var btt = function(name, strJP, strEN, eval){
			if(eval===false){ return;}
			var el = ee.createEL(menu.EL_BUTTON,''); el.name = name;
			ee('urlbuttonarea').appendEL(el).appendBR();
			btn(el, func, strJP, strEN);
		};
		btt('pzprv3',     "ぱずぷれv3のURLを出力する",           "Output PUZ-PRE v3 URL",          true);
		btt('pzprapplet', "ぱずぷれ(アプレット)のURLを出力する", "Output PUZ-PRE(JavaApplet) URL", !k.ispzprv3ONLY);
		btt('kanpen',     "カンペンのURLを出力する",             "Output Kanpen URL",              k.isKanpenExist);
		btt('heyaapp',    "へやわけアプレットのURLを出力する",   "Output Heyawake-Applet URL",     (k.puzzleid==="heyawake"));
		btt('pzprv3edit', "ぱずぷれv3の再編集用URLを出力する",   "Output PUZ-PRE v3 Re-Edit URL",  true);
		ee("urlbuttonarea").appendBR();
		func = ee.ebinder(this.ex, this.ex.openurl);
		btn(document.urloutput.openurl, func,  "このURLを開く", "Open this URL on another window/tab");
		btn(document.urloutput.close,   close, "閉じる", "Close");

		// ファイル入力 -------------------------------------------------------
		func = ee.ebinder(this.ex, this.ex.fileopen);
		lab(ee('bar1_4').el,      "ファイルを開く", "Open file");
		lab(ee('pop1_4_cap0').el, "ファイル選択",   "Choose file");
		document.fileform.filebox.onchange = func;
		btn(document.fileform.close,    close, "閉じる",     "Close");

		// データベースを開く -------------------------------------------------
		func = ee.ebinder(fio.dbm, fio.dbm.clickHandler);
		lab(ee('bar1_8').el, "一時保存/戻す", "Temporary Stack");
		document.database.sorts   .onchange = func;
		document.database.datalist.onchange = func;
		document.database.tableup .onclick  = func;
		document.database.tabledn .onclick  = func;
		btn(document.database.open,     func,  "データを読み込む",   "Load");
		btn(document.database.save,     func,  "盤面を保存",         "Save");
		lab(ee('pop1_8_com').el, "コメント:", "Comment:");
		btn(document.database.comedit,  func,  "コメントを編集する", "Edit Comment");
		btn(document.database.difedit,  func,  "難易度を設定する",   "Set difficulty");
		btn(document.database.del,      func,  "削除",               "Delete");
		btn(document.database.close,    close, "閉じる",             "Close");

		// 盤面の調整 ---------------------------------------------------------
		func = ee.ebinder(this.ex, this.ex.popupadjust);
		lab(ee('bar2_1').el,      "盤面の調整",             "Adjust the board");
		lab(ee('pop2_1_cap0').el, "盤面の調整を行います。", "Adjust the board.");
		lab(ee('pop2_1_cap1').el, "拡大",  "Expand");
		btn(document.adjust.expandup,   func,  "上",     "UP");
		btn(document.adjust.expanddn,   func,  "下",     "Down");
		btn(document.adjust.expandlt,   func,  "左",     "Left");
		btn(document.adjust.expandrt,   func,  "右",     "Right");
		lab(ee('pop2_1_cap2').el, "縮小", "Reduce");
		btn(document.adjust.reduceup,   func,  "上",     "UP");
		btn(document.adjust.reducedn,   func,  "下",     "Down");
		btn(document.adjust.reducelt,   func,  "左",     "Left");
		btn(document.adjust.reducert,   func,  "右",     "Right");
		btn(document.adjust.close,      close, "閉じる", "Close");

		// 反転・回転 ---------------------------------------------------------
		lab(ee('bar2_2').el,      "反転・回転",                  "Flip/Turn the board");
		lab(ee('pop2_2_cap0').el, "盤面の回転・反転を行います。","Flip/Turn the board.");
		btn(document.flip.turnl,  func,  "左90°回転", "Turn left by 90 degree");
		btn(document.flip.turnr,  func,  "右90°回転", "Turn right by 90 degree");
		btn(document.flip.flipy,  func,  "上下反転",   "Flip upside down");
		btn(document.flip.flipx,  func,  "左右反転",   "Flip leftside right");
		btn(document.flip.close,  close, "閉じる",     "Close");

		// credit -------------------------------------------------------------
		lab(ee('bar3_1').el,   "credit", "credit");
		lab(ee('credit3_1').el,"ぱずぷれv3 "+pzprversion+"<br>\n<br>\nぱずぷれv3は はっぱ/連続発破が作成しています。<br>\nライブラリとしてuuCanvas1.0, Google Gearsを使用しています。<br>\n<br>\n",
							   "PUZ-PRE v3 "+pzprversion+"<br>\n<br>\nPUZ-PRE v3 id made by happa.<br>\nThis script use uuCanvas1.0 and Google Gears as libraries.&nbsp;<br>\n<br>\n");
		btn(document.credit.close,  close, "閉じる", "OK");

		// 表示サイズ ---------------------------------------------------------
		func = ee.ebinder(this, this.ex.dispsize);
		lab(ee('bar4_1').el,      "表示サイズの変更",         "Change size");
		lab(ee('pop4_1_cap0').el, "表示サイズを変更します。", "Change the display size.");
		lab(ee('pop4_1_cap1').el, "表示サイズ",               "Display size");
		btn(document.dispsize.dispsize, func,  "変更する",   "Change");
		btn(document.dispsize.cancel,   close, "キャンセル", "Cancel");

		// poptest ------------------------------------------------------------
		debug.poptest_func();
	},

	//---------------------------------------------------------------------------
	// menu.popopen()  ポップアップメニューを開く
	// menu.popclose() ポップアップメニューを閉じる
	//---------------------------------------------------------------------------
	popopen : function(e, idname){
		// 表示しているウィンドウがある場合は閉じる
		this.popclose();

		// この中でmenu.popも設定されます。
		if(pp.funcs[idname]){ pp.funcs[idname]();}

		// ポップアップメニューを表示する
		if(this.pop){
			var _pop = this.pop.el;
			_pop.style.left = ee.pageX(e) - 8 + 'px';
			_pop.style.top  = ee.pageY(e) - 8 + 'px';
			_pop.style.display = 'inline';
		}
	},
	popclose : function(){
		if(this.pop){
			if(this.pop.el.id=='pop1_8'){
				fio.dbm.closeDialog();
			}

			this.pop.el.style.display = "none";
			this.pop = '';
			this.menuclear();
			this.movingpop = "";
			kc.enableKey = true;
		}
	},

	//---------------------------------------------------------------------------
	// menu.titlebarfunc()  下の4つのイベントをイベントハンドラにくっつける
	// menu.titlebardown()  タイトルバーをクリックしたときの動作を行う(タイトルバーにbind)
	// menu.titlebarup()    タイトルバーでボタンを離したときの動作を行う(documentにbind)
	// menu.titlebarmove()  タイトルバーからマウスを動かしたときポップアップメニューを動かす(documentにbind)
	//---------------------------------------------------------------------------
	titlebarfunc : function(bar){
		bar.onmousedown = ee.ebinder(this, this.titlebardown);
		ee(bar).unselectable().el;
	},

	titlebardown : function(e){
		var pop = ee.getSrcElement(e).parentNode;
		this.movingpop = pop;
		this.offset.x = ee.pageX(e) - parseInt(pop.style.left);
		this.offset.y = ee.pageY(e) - parseInt(pop.style.top);
	},
	titlebarup : function(e){
		var pop = this.movingpop;
		if(!!pop){
			this.movingpop = "";
		}
	},
	titlebarmove : function(e){
		var pop = this.movingpop;
		if(!!pop){
			pop.style.left = ee.pageX(e) - this.offset.x + 'px';
			pop.style.top  = ee.pageY(e) - this.offset.y + 'px';
		}
	},

//--------------------------------------------------------------------------------------------------------------

	//--------------------------------------------------------------------------------
	// menu.isLangJP()  言語モードを日本語にする
	// menu.isLangEN()  言語モードを英語にする
	//--------------------------------------------------------------------------------
	isLangJP : function(){ return this.language == 'ja';},
	isLangEN : function(){ return this.language == 'en';},

	//--------------------------------------------------------------------------------
	// menu.setLang()   言語を設定する
	// menu.translate() htmlの言語を変える
	//--------------------------------------------------------------------------------
	setLang : function(ln){ (ln=='ja')       ?this.setLangJP():this.setLangEN();},
	translate : function(){ (this.isLangJP())?this.setLangEN():this.setLangJP();},

	//--------------------------------------------------------------------------------
	// menu.setLangJP()  文章を日本語にする
	// menu.setLangEN()  文章を英語にする
	// menu.setLangStr() 文章を設定する
	//--------------------------------------------------------------------------------
	setLangJP : function(){ this.setLangStr('ja');},
	setLangEN : function(){ this.setLangStr('en');},
	setLangStr : function(ln){
		this.language = ln;
		document.title = base.gettitle();
		ee('title2').el.innerHTML = base.gettitle();
		ee('expression').el.innerHTML = base.expression[this.language];

		this.displayAll();
		this.ex.dispmanstr();

		base.resize_canvas();
	}
};

//--------------------------------------------------------------------------------------------------------------

//---------------------------------------------------------------------------
// ★Propertiesクラス 設定値の値などを保持する
//---------------------------------------------------------------------------
SSData = function(){
	this.id     = '';
	this.type   = 0;
	this.val    = 1;
	this.parent = 1;
	this.child  = [];

	this.str    = { ja: new Caption(), en: new Caption()};
	//this.func   = null;
};
Properties = function(){
	this.flags    = [];	// サブメニュー項目の情報(SSDataクラスのオブジェクトの配列になる)
	this.flaglist = [];	// idnameの配列

	// const
	this.MENU     = 6;
	this.SPARENT  = 7;
	this.SMENU    = 0;
	this.SELECT   = 1;
	this.CHECK    = 2;
	this.LABEL    = 3;
	this.CHILD    = 4;
	this.SEPARATE = 5;
};
Properties.prototype = {
	reset : function(){
		this.flags    = [];
		this.flaglist = [];
	},

	//---------------------------------------------------------------------------
	// pp.addMenu()      メニュー最上位の情報を登録する
	// pp.addSParent()   フロートメニューを開くサブメニュー項目を登録する
	// pp.addSmenu()     Popupメニューを開くサブメニュー項目を登録する
	// pp.addCaption()   Captionとして使用するサブメニュー項目を登録する
	// pp.addSeparator() セパレータとして使用するサブメニュー項目を登録する
	// pp.addCheck()     選択型サブメニュー項目に表示する文字列を設定する
	// pp.addSelect()    チェック型サブメニュー項目に表示する文字列を設定する
	// pp.addChild()     チェック型サブメニュー項目の子要素を設定する
	// pp.addFlagOnly()  情報のみを登録する
	//---------------------------------------------------------------------------
	addMenu : function(idname, strJP, strEN){
		this.addFlags(idname, '', this.MENU, 0, strJP, strEN);
	},
	addSParent : function(idname, parent, strJP, strEN){
		this.addFlags(idname, parent, this.SPARENT, 0, strJP, strEN);
	},

	addSmenu : function(idname, parent, strJP, strEN){
		this.addFlags(idname, parent, this.SMENU, 0, strJP, strEN);
	},

	addCaption : function(idname, parent, strJP, strEN){
		this.addFlags(idname, parent, this.LABEL, 0, strJP, strEN);
	},
	addSeparator : function(idname, parent){
		this.addFlags(idname, parent, this.SEPARATE, 0, '', '');
	},

	addCheck : function(idname, parent, first, strJP, strEN){
		this.addFlags(idname, parent, this.CHECK, first, strJP, strEN);
	},
	addSelect : function(idname, parent, first, child, strJP, strEN){
		this.addFlags(idname, parent, this.SELECT, first, strJP, strEN);
		this.flags[idname].child = child;
	},
	addChild : function(idname, parent, strJP, strEN){
		var list = idname.split("_");
		this.addFlags(idname, list[0], this.CHILD, list[1], strJP, strEN);
	},

	addFlagOnly : function(idname, first){
		this.addFlags(idname, '', '', first, '', '');
	},

	//---------------------------------------------------------------------------
	// pp.addFlags()  上記関数の内部共通処理
	// pp.setLabel()  管理領域に表記するラベル文字列を設定する
	//---------------------------------------------------------------------------
	addFlags : function(idname, parent, type, first, strJP, strEN){
		this.flags[idname] = new SSData();
		this.flags[idname].id     = idname;
		this.flags[idname].type   = type;
		this.flags[idname].val    = first;
		this.flags[idname].parent = parent;
		this.flags[idname].str.ja.menu = strJP;
		this.flags[idname].str.en.menu = strEN;
		this.flaglist.push(idname);
	},

	setLabel : function(idname, strJP, strEN){
		if(!this.flags[idname]){ return;}
		this.flags[idname].str.ja.label = strJP;
		this.flags[idname].str.en.label = strEN;
	},

	//---------------------------------------------------------------------------
	// pp.getMenuStr() 管理パネルと選択型/チェック型サブメニューに表示する文字列を返す
	// pp.getLabel()   管理パネルとチェック型サブメニューに表示する文字列を返す
	// pp.type()       設定値のサブメニュータイプを返す
	// pp.istype()     設定値のサブメニュータイプが指定された値かどうかを返す
	//
	// pp.getVal()     各フラグのvalの値を返す
	// pp.setVal()     各フラグの設定値を設定する
	//---------------------------------------------------------------------------
	getMenuStr : function(idname){ return this.flags[idname].str[menu.language].menu; },
	getLabel   : function(idname){ return this.flags[idname].str[menu.language].label;},
	type   : function(idname)     { return this.flags[idname].type;},
	istype : function(idname,type){ return (this.flags[idname].type===type);},

	getVal : function(idname)  { return this.flags[idname]?this.flags[idname].val:0;},
	setVal : function(idname, newval, callfunc){
		if(!this.flags[idname]){ return;}
		else if(this.flags[idname].type===this.CHECK || this.flags[idname].type===this.SELECT){
			this.flags[idname].val = newval;
			menu.setdisplay(idname);
			if(this.funcs[idname] && callfunc!==false){ this.funcs[idname](newval);}
		}
	},

//--------------------------------------------------------------------------------------------------------------
	// submenuから呼び出される関数たち
	funcs : {
		urlinput  : function(){ menu.pop = ee("pop1_2");},
		urloutput : function(){ menu.pop = ee("pop1_3"); document.urloutput.ta.value = "";},
		fileopen  : function(){ menu.pop = ee("pop1_4");},
		filesave  : function(){ menu.ex.filesave(fio.PZPR);},
		filesave2 : function(){ if(!!fio.kanpenSave){ menu.ex.filesave(fio.PBOX);}},
		imagedl   : function(){ menu.ex.imagesave(true);},
		imagesave : function(){ menu.ex.imagesave(false);},
		database  : function(){ menu.pop = ee("pop1_8"); fio.dbm.openDialog();},
		adjust    : function(){ menu.pop = ee("pop2_1");},
		turn      : function(){ menu.pop = ee("pop2_2");},
		credit    : function(){ menu.pop = ee("pop3_1");},
		jumpv3    : function(){ window.open('./', '', '');},
		jumptop   : function(){ window.open('../../', '', '');},
		jumpblog  : function(){ window.open('http://d.hatena.ne.jp/sunanekoroom/', '', '');},
		irowake   : function(){ pc.paintAll();},
		cursor    : function(){ pc.paintAll();},
		manarea   : function(){ menu.ex.dispman();},
		mode      : function(num){ menu.ex.modechange(num);},
		size      : function(num){ base.resize_canvas();},
		repaint   : function(num){ base.resize_canvas();},
		language  : function(num){ menu.setLang({0:'ja',1:'en'}[num]);},

		newboard : function(){
			menu.pop = ee("pop1_1");
			if(k.puzzleid!="sudoku"){
				document.newboard.col.value = k.qcols;
				document.newboard.row.value = k.qrows;
			}
			kc.enableKey = false;
		},
		dispsize : function(){
			menu.pop = ee("pop4_1");
			document.dispsize.cs.value = k.cellsize;
			kc.enableKey = false;
		},
		keypopup : function(){
			var f = kp.ctl[pp.flags['mode'].val].enable;
			ee('ck_keypopup').el.disabled    = (f?"":"true");
			ee('cl_keypopup').el.style.color = (f?"black":"silver");
		}
	}
};

//---------------------------------------------------------------------------
// ★debugオブジェクト  poptest関連の関数など
//---------------------------------------------------------------------------
var debug = {
	extend : function(object){
		for(var i in object){ this[i] = object[i];}
	},

	poptest_func : function(){
		menu.titlebarfunc(ee('bartest').el);

		document.testform.t1.onclick        = ee.binder(this, this.perfeval);
		document.testform.t2.onclick        = ee.binder(this, this.painteval);
		document.testform.t3.onclick        = ee.binder(this, this.resizeeval);
		document.testform.perfload.onclick  = ee.binder(this, this.loadperf);

		document.testform.filesave.onclick  = ee.binder(this, this.filesave);
		document.testform.pbfilesave.onclick  = ee.binder(this, this.filesave_pencilbox);

		document.testform.fileopen.onclick  = ee.binder(this, this.fileopen);
		document.testform.database.onclick  = ee.binder(this, this.dispdatabase);

		document.testform.erasetext.onclick = ee.binder(this, this.erasetext);
		document.testform.close.onclick     = function(e){ ee('poptest').el.style.display = 'none';};

		document.testform.testarea.style.fontSize = '10pt';

		document.testform.starttest.style.display = 'none';

		document.testform.perfload.style.display = (k.puzzleid!=='country' ? 'none' : 'inline');
		document.testform.pbfilesave.style.display = (!menu.ispencilbox ? 'none' : 'inline');
		document.testform.database.style.display = (!fio.DBaccept<0x08 ? 'none' : 'inline');

		if(k.scriptcheck){ debug.testonly_func();}	// テスト用
	},

	disppoptest : function(){
		var _pop_style = ee('poptest').el.style;
		_pop_style.display = 'inline';
		_pop_style.left = '40px';
		_pop_style.top  = '80px';
	},

	// k.scriptcheck===true時はオーバーライドされます
	keydown : function(ca){
		if(kc.isCTRL && ca=='F8'){
			this.disppoptest();
			kc.tcMoved = true;
			return true;
		}
		return false;
	},

	filesave : function(){
		this.setTA(fio.fileencode(fio.PZPR).replace(/\//g,"\n"));
		this.addTA('');
		this.addTA(fio.urlstr);
	},
	filesave_pencilbox : function(){
		this.setTA(fio.fileencode(fio.PBOX).replace(/\//g,"\n"));
	},

	fileopen : function(){
		var dataarray = this.getTA().split("\n");
		fio.filedecode(dataarray.join("/"));
	},

	erasetext : function(){
		this.setTA('');
		if(k.scriptcheck){ ee('testdiv').el.innerHTML = '';}
	},

	perfeval : function(){
		this.timeeval("正答判定測定",ee.binder(ans, ans.checkAns));
	},
	painteval : function(){
		this.timeeval("描画時間測定",ee.binder(pc, pc.paintAll));
	},
	resizeeval : function(){
		this.timeeval("resize描画測定",ee.binder(base, base.resize_canvas));
	},
	timeeval : function(text,func){
		this.addTA(text);
		var count=0, old = tm.now();
		while(tm.now() - old < 3000){
			count++;

			func();
		}
		var time = tm.now() - old;

		this.addTA("測定データ "+time+"ms / "+count+"回\n"+"平均時間   "+(time/count)+"ms")
	},

	dispdatabase : function(){
		var text = "";
		for(var i=0;i<localStorage.length;i++){
			var key = localStorage.key(i);
			text += (""+key+" "+localStorage[key]+"\n");
		}
		this.setTA(text);
	},

	loadperf : function(){
		fio.filedecode("pzprv3/country/10/18/44/0 0 1 1 1 2 2 2 3 4 4 4 5 5 6 6 7 8 /0 9 1 10 10 10 11 2 3 4 12 4 4 5 6 13 13 8 /0 9 1 1 10 10 11 2 3 12 12 12 4 5 14 13 13 15 /0 9 9 9 10 16 16 16 16 17 12 18 4 5 14 13 15 15 /19 19 19 20 20 20 21 17 17 17 22 18 18 14 14 23 23 24 /19 25 25 26 26 21 21 17 22 22 22 18 27 27 27 24 24 24 /28 28 29 26 30 31 21 32 22 33 33 33 33 34 35 35 35 36 /28 29 29 26 30 31 32 32 32 37 38 39 34 34 40 40 35 36 /41 29 29 42 30 31 31 32 31 37 38 39 34 34 34 40 35 36 /41 43 42 42 30 30 31 31 31 37 38 38 38 40 40 40 36 36 /3 . 6 . . 4 . . 2 . . . . . . . . 1 /. . . 5 . . . . . . . . . . . . . . /. . . . . . . . . 1 . . . . . . . . /. . . . . . . . . . . . . . . . . . /3 . . 2 . . . 4 . . . . . . . . . . /. . . 3 . . . . 4 . . . 2 . . . . . /. . . . 3 6 . . . 4 . . . . . . . . /. 5 . . . . . . . 2 . . 3 . . . . . /. . . . . . . . . . . . . . . . . . /. . . . . . . . . . . . . . . . 5 . /0 0 1 1 0 0 1 0 0 1 1 0 0 0 1 1 0 /1 0 0 0 1 0 0 0 1 0 0 1 0 0 0 0 1 /0 0 1 0 1 0 0 1 0 0 0 0 0 0 0 0 0 /0 1 1 0 0 0 1 0 0 1 1 0 1 0 0 0 1 /1 1 0 0 1 0 0 1 1 0 0 0 0 1 0 1 0 /0 1 0 1 0 1 0 0 1 1 1 0 1 0 0 1 1 /1 0 1 0 0 0 0 1 0 1 1 1 0 0 1 1 0 /0 1 0 0 0 0 1 0 0 0 0 1 1 0 1 0 0 /0 1 1 0 1 1 0 0 1 0 1 0 0 0 0 0 0 /1 1 1 0 0 0 1 1 0 0 1 1 1 1 1 0 1 /0 0 1 0 1 0 1 1 0 1 0 1 0 0 1 0 1 0 /1 1 1 0 0 1 1 1 1 0 0 0 1 0 1 0 0 1 /1 1 0 1 1 0 1 0 0 0 0 0 1 0 1 0 0 1 /1 0 0 0 1 0 0 1 0 1 0 1 0 1 1 0 1 0 /0 0 1 0 0 1 0 0 0 0 0 1 0 0 0 1 0 0 /0 1 0 1 1 0 1 0 1 0 0 0 1 1 0 0 0 1 /1 0 1 0 1 0 1 1 0 1 0 0 0 1 1 0 1 1 /1 1 0 0 1 0 0 0 0 1 0 1 0 0 0 1 1 1 /1 0 0 1 0 0 1 0 1 0 1 0 0 0 0 1 1 1 /2 2 1 1 1 2 0 0 2 0 1 0 0 0 0 0 0 2 /1 1 1 2 1 1 0 0 0 1 2 1 0 0 1 2 0 0 /1 0 1 1 1 1 0 0 1 2 2 2 1 0 1 2 2 0 /1 0 0 1 1 2 1 0 2 1 1 1 1 0 1 2 1 0 /1 1 0 2 1 1 2 0 0 0 2 1 2 1 1 1 0 2 /2 1 0 1 1 1 0 2 0 0 0 0 1 1 2 1 0 0 /1 0 1 1 1 2 1 1 0 0 0 0 0 0 1 0 0 0 /0 1 1 2 1 2 1 1 2 1 2 0 1 0 1 0 0 0 /0 1 1 0 1 1 1 2 0 1 0 1 2 2 2 1 0 0 /0 0 0 1 2 2 1 1 0 2 0 0 1 0 1 0 0 0 /");
		pp.setVal('mode',3);
		pp.setVal('irowake',true);
	},

	getTA : function(){ return document.testform.testarea.value;},
	setTA : function(str){ document.testform.testarea.value  = str;},
	addTA : function(str){ document.testform.testarea.value += (str+"\n");}
};
