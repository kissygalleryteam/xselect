
var $ = require('node').one;
var $$ = require('node').all;
var Base = require('base');
var XTemplate = require('xtemplate');

var doc = $(document), root = $('html'), win = $(window);

var xSelect = Base.extend(
    {
        initializer: function () {
            var me = this;

            me._renderUI();
            me._bindUI();
            me.fire('afterRenderUI');

            me.sync();
        },

        _renderUI: function () {
            var me = this;
            var select = me.get('el');
            var drop, popup;

            drop = $('<div class="xselect-drop"></div>').html(xSelect.DROP_TMPL.render());
            popup = $('<div class="xselect-popup"></div>').html(xSelect.POPUP_TMPL.render({addForm: me.get('addForm')}));

            drop.insertAfter(select);
            popup.appendTo('body');

            me.set('elDrop', drop);
            me.set('elPopup', popup);

            return me;
        },
        _bindUI: function () {
            var me = this;
            var select = me.get('el'), drop = me.get('elDrop'), popup = me.get('elPopup');

            // select
            select
                .on('change', function (ev) {
                    me.select(select[0].selectedIndex);
                });

            // drop
            drop
                .on('mouseenter', function (ev) {
                    me.set('active', true);
                })
                .on('mouseleave', function (ev) {
                    me.set('active', false);
                })
                .on('click', function (ev) {
                    me.fire('click', ev);
                    me.toggle();
                })
                .insertAfter(select);

            // popup
            popup
                .on('mouseenter', function (ev) {
                    me.set('active', true);
                    root.css('overflow', 'hidden');
                })
                .on('mouseleave', function (ev) {
                    me.set('active', false);
                    root.css('overflow', '');
                })
                .delegate('click', '.xselect-option', function (ev) {
                    ev.halt();
                    me.select($(ev.currentTarget).attr('data-index'), true);
                })
                .appendTo('body');

            // doc
            doc.on('click', function (ev) {
                if (!me.get('active')) {
                    me.close();
                }
            });

            // add form
            me._bindAddForm();

            // fix resize
            me._resizeFix();

            return me;
        },
        _bindAddForm: function () {
            var me = this;
            var popup = me.get('elPopup');

            if (me.get('addForm')) {
                var support = 'placeholder' in document.createElement('input');

                var addOptInput, addOptIptPlaceholder, addOptButton, addOptForm;
                addOptForm = $$('.xselect-addoption', popup);
                addOptInput = $$('.xselect-addoption-ipt', addOptForm);
                addOptButton = $$('.xselect-addoption-btn', addOptForm);

                var enable, disable;
                enable = function (reset) {
                    addOptButton.removeClass('xselect-addoption-btn-disabled');
                    if (reset) {
                        addOptInput.val('');
                        addOptButton.addClass('xselect-addoption-btn-disabled');
                    }
                };
                disable = function () {
                    addOptButton.addClass('xselect-addoption-btn-disabled');
                };

                if(!support){
                    addOptIptPlaceholder = $('<label for="xselect_ipt" class="xselect-addoption-ipt-placeholder">' + me.get('addForm').placeholder + '</label>');
                    addOptIptPlaceholder.insertAfter(addOptInput);
                    addOptInput
                        .on('valuechange', function (ev) {
                            if (ev.newVal != '') {
                                addOptIptPlaceholder.hide();
                            } else {
                                addOptIptPlaceholder.show();
                            }
                        });
                }

                addOptInput
                    .on('valuechange', function (ev) {
                        var val = S.trim(ev.newVal);
                        if (val) {
                            addOptButton.removeClass('xselect-addoption-btn-disabled');
                        } else {
                            addOptButton.addClass('xselect-addoption-btn-disabled');
                        }
                    });
                addOptForm.on('submit', function (ev) {
                    ev.preventDefault();
                    if (!addOptButton.hasClass('xselect-addoption-btn-disabled')) {
                        me.get('addForm').onSubmit.call(me,
                            addOptInput.val(), enable, disable
                        );
                    }
                });
            }

            return me;
        },
        _resizeFix: function () {
            var me = this;

            var timer = null;
            win.on('resize', function (ev) {
                if (timer) {
                    clearTimeout(timer);
                }

                timer = setTimeout(function () {
                    me.set('pos',
                        me.get('elDrop').offset()
                    );

                    me.set('size', {
                        width: me.get('elDrop').outerWidth(),
                        height: me.get('elDrop').innerHeight()
                    });
                }, 250);
            });

            return me;
        },
        _syncUI: function () {
            var me = this;
            var list = $$('.xselect-list', me.get('elPopup'));
            var title = $$('.xselect-title', me.get('elDrop'));
            var options = me.get('options'), selectedIndex = me.get('selectedIndex');
            var selectedOption = S.filter(options, function(_, i){ return i == selectedIndex; })[0];

            list.html(
                xSelect.OPTION_TMPL.render({
                    selectedIndex: selectedIndex,
                    options: options
                })
            );
            title.html(selectedOption.text);

            me.fire('afterSyncUI');

            return me;
        },

        sync: function () {
            var me = this;
            var select = me.get('el')[0], _options = select.options;
            var options = [];

            for (var i = 0, len = _options.length; i < len; i += 1) {
                options.push({
                    text: _options[i].text,
                    value: _options[i].value,
                    as_placeholder: !_options[i].value //没值的option作为placeholder
                });
            }
            me.set('options', options);
            me.set('selectedIndex', select.selectedIndex);

            me._syncUI();

            return me;
        },

        toggle: function () {
            var me = this;
            var opened = me.get('opened');
            if (!opened) {
                me.open();
            } else {
                me.close();
            }

            return me;
        },
        open: function () {
            var me = this;
            var popup = me.get('elPopup'), drop = me.get('elDrop');
            var pos = me.get('pos'), size = me.get('size');

            drop.addClass('xselect-drop-focus');
            popup.css({
                'left': pos.left,
                'top': pos.top + size.height + 1,
                'width': size.width - 2
            }).addClass('xselect-popup-focus');

            me.set('opened', true);

            me.fire('open');

            return me;
        },
        close: function () {
            var me = this;
            var popup = me.get('elPopup'), drop = me.get('elDrop');

            drop.removeClass('xselect-drop-focus');
            popup.css({
                'left': -999999,
                'top': -999999
            }).removeClass('xselect-popup-focus');

            me.set('opened', false);

            me.fire('close');

            return me;
        },

        select: function (index, closed) {
            var me = this;
            var select = me.get('el')[0];

            index = parseInt(index, 10);

            $$('option', select).attr('selected', false);
            $(select.options[index]).attr('selected', true);

            me.sync();

            me.fire('change', {selectedIndex: index});

            if (closed) {
                me.close();
            }

            return me;
        },

        add: function (text, value, selected) {
            var me = this;
            var select = me.get('el');
            var popup = me.get('elPopup')
            var list = $$('.xselect-list', popup), listWrapper = $$('.xselect-options', popup);

            var option = '<option value="' + value + '"' + (selected ? ' selected="selected"' : '') + '>' + text + '</option>';
            if (selected) {
                $$('option', select).attr('selected', false);
            }
            select.append($(option));

            me.sync();

            listWrapper.scrollTop(list.height());

            return me;
        },
        batchAdd: function (arr, reset) {
            var me = this;
            var select = me.get('el');

            if (reset) {
                $$('option', select).attr('selected', false);
            }

            for (var i = 0, len = arr.length; i < len; i += 1) {
                var item = arr[i];
                var option = '<option value="' + item.value + '"' + (item.selected ? ' selected="selected"' : '') + '>' + item.text + '</option>';
                select.append($(option));
            }

            me.sync();

            return me;
        }
    },
    {
        name: 'xSelect',
        ATTRS: {
            el: {
                value: null,
                setter: function (v) {
                    v = $(v);
                    v.hide();
                    return v;
                }
            },
            elDrop: {
                value: null
            },
            elPopup: {
                value: null
            },
            pos: {
                value: null,
                getter: function (v) {
                    if (!v) {
                        v = this.get('elDrop').offset();
                    }
                    return v;
                }
            },
            size: {
                value: null,
                getter: function (v) {
                    if (!v) {
                        v = {
                            width: this.get('elDrop').outerWidth(),
                            height: this.get('elDrop').innerHeight()
                        };
                    }
                    return v;
                }
            },
            options: {
                value: null
            },
            selectedIndex: {
                value: -1
            },
            opened: {
                value: false
            },
            active: {
                value: false
            },
            error: {
                value: false,
                setter: function (v) {
                    if (v == true) {
                        this.get('elDrop').addClass('xselect-drop-error');
                        this.get('elPopup').addClass('xselect-popup-error');
                    } else {
                        this.get('elDrop').removeClass('xselect-drop-error');
                        this.get('elPopup').removeClass('xselect-popup-error');
                    }
                }
            },
            addForm: {
                value: false,
                getter: function (v) {
                    if (v) {
                        v.placeholder = v.placeholder || '请输入...';
                        v.maxlength = Math.max(v.maxlength, 0);
                        v.onSubmit = v.onSubmit || function(val, enable, disable) { };
                    }
                    return v;
                }
            }
        },
        DROP_TMPL: new XTemplate(
            '<span class="xselect-title">请选择</span>'+
                '<i class="xselect-drop-icon"></i>'
        ),
        POPUP_TMPL: new XTemplate(
            '<div class="xselect-options">'+
                '<ul class="xselect-list"></ul>'+
                '</div>'+
                '{{#if addForm}}'+
                '<form class="xselect-addoption">'+
                '<input id="xselect_ipt" class="xselect-addoption-ipt" placeholder="{{addForm.placeholder}}" {{#if addForm.maxlength}}maxlength="{{addForm.maxlength}}"{{/if}}>'+
                '<button type="submit" class="xselect-addoption-btn xselect-addoption-btn-disabled">确定</button>'+
                '</form>'+
                '{{/if}}'
        ),
        OPTION_TMPL: new XTemplate(
            '{{#each options}}'+
                '{{^if as_placeholder}}'+
                '<li>'+
                '<a class="xselect-option {{#if xindex===selectedIndex}}xselect-option-selected{{/if}}" data-index="{{xindex}}" href="javascript:void(0);" title="{{text}}">'+
                '{{text}}'+
                '</a>'+
                '</li>'+
                '{{/if}}'+
                '{{/each}}'
        )
    }
);

module.exports = xSelect;

