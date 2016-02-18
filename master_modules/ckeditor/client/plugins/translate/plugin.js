var transLang = '';
var transUrlApi = '';
var transLangDefault = '';

CKEDITOR.plugins.add('translate',{
    init: function (editor) {

        transLang = editor.config.transLang;

        editor.ui.addButton('Translate',
            {
                label: 'Translate text',
                command: 'translateOut',
                icon: '/images/translate.png'
        });
        editor.addMenuItems({
            translate: {
                label: /*editor.lang.translate.menu*/ 'Traducir',
                command: 'translateIn',
                group: 'clipboard',
                icon: '/images/translate.png',
                order: 1
            }
        });

        editor.addCommand( 'translateOut', new CKEDITOR.dialogCommand('translateDialog'));

        editor.addCommand('translateIn', {
            exec: function (edt) {
                var select = edt.getSelection().getSelectedText();
                if(select.length>0) {
                    var translate = getTranslate(select, editor);
                    translate.onreadystatechange = function () {
                        if (translate.readyState == 4) {
                            var res = translate.responseText;
                            res = JSON.parse(res);
                            if(res.data){
                                editor.insertHtml(res.data);
                            }
                        }
                    };
                }
            }
        });

        CKEDITOR.dialog.add( 'translateDialog', function( editor ) {
            return {
                title: 'Translation',
                minWidth: 400,
                minHeight: 200,
                contents: [
                    {
                        id: 'tab-basic',
                        label: 'Basic',
                        elements: [
                            {
                                type: 'html',
                                html: '<div id="myTextTranslate"></div>',
                                id: 'translateTxt',
                                class: 'boxTranslate'
                            }
                        ]
                    }
                ],
                onOk: function() {
                    var dialog = this;
                    var text = document.getElementById('myTextTranslate').innerHTML;
                    editor.insertHtml(text);
                },
                onShow: function(){
                    var dialog = this;
                    var select = editor.getSelection().getSelectedText();
                    if (!select) {
                        select = editor.getData();
                    }
                    if(select.length>0){
                        var translate = getTranslate(select, editor);
                        translate.onreadystatechange = function () {
                            if (translate.readyState == 4) {
                                var res = translate.responseText;
                                res = JSON.parse(res);
                                if(res.data){
                                    document.getElementById('myTextTranslate').innerHTML = res.data;
                                    // dialog.setValueOf( 'tab-basic','translateTxt', res.data);
                                }
                            }
                        };
                    }
                }
            };
        });


        editor.contextMenu.addListener(function (element, selection) {
            return {
                translate: CKEDITOR.TRISTATE_OFF
            };
        });
        function RefreshState() {

            transUrlApi = CKEDITOR.config.transUrlApi;
            transLangDefault = CKEDITOR.config.transLangDefault;

            
            if(!transLangDefault || !transLang || transLangDefault===transLang){
                /* DESACTIVATS */
                editor.getCommand('translateIn').setState(CKEDITOR.TRISTATE_DISABLED);
                editor.getCommand('translateOut').setState(CKEDITOR.TRISTATE_DISABLED);
            }else{
                if(editor.getSelection().getSelectedText()){
                    /* TEXT SELECCIONAT */
                    editor.getCommand('translateIn').setState(CKEDITOR.TRISTATE_OFF);
                    editor.getCommand('translateOut').setState(CKEDITOR.TRISTATE_OFF);
                /*
                }else if(editor.getData()){
                    /* HI HA ALGO DE TEXT * /
                    editor.getCommand('translateIn').setState(CKEDITOR.TRISTATE_DISABLED);
                    editor.getCommand('translateOut').setState(CKEDITOR.TRISTATE_OFF);
                */
                }else{
                    /* NO HI HA NI TEXT NI SELECCIONAT */
                    editor.getCommand('translateIn').setState(CKEDITOR.TRISTATE_DISABLED);
                    editor.getCommand('translateOut').setState(CKEDITOR.TRISTATE_DISABLED);
                }
            }

        }
        var throttledFunction = CKEDITOR.tools.eventsBuffer( 250, RefreshState );
        editor.on('selectionCheck', throttledFunction.input);
        editor.on( 'instanceReady', function( evt ) {
            RefreshState();
        });
    }
});

function getTranslate(select, editor) {

    var model = {
        langDefault: transLangDefault,
        lang: editor.config.transLang,
        sourceText: select
    };

    model = JSON.stringify(model);

    var xhttp = new XMLHttpRequest();
    xhttp.open("POST", transUrlApi, true);
    xhttp.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    xhttp.send(model);
    return xhttp;
}