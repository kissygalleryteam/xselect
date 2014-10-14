## 综述

Xselect。

## 初始化组件
		
    S.use('kg/xselect/1.0.0/index', function (S, Xselect) {
         var xselect = new Xselect({
            el: '#J_select',
            addForm: {
                placeholder: '新增',
                maxlength: 50,
                onSubmit: function (val, enable, disable) {
                    //
                }
            }
         });

         //
         xselect.get('selectedIndex');
         xselect.get('options');
    })

## API说明
