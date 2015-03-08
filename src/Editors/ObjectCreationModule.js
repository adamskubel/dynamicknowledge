define(function(require,exports,module)
{
    var DynamicObject = require('Model/DynamicObject');
    var Utils = require('Utils');
    var ListSelector = require('Views/ListSelector');
    var MenuBar = require('Views/MenuBar');
    var Colors = require('Colors');

    function ObjectCreationModule(objectDef)
    {
        this.objectDef = objectDef;
    }

    function _getCreationList(objectDef)
    {
        return ["Label","AccessInspector"];
    }

    ObjectCreationModule.prototype.createUI = function(menu)
    {
        this.hide();

        var selector = new ListSelector({
            size:[80,40],
            color:Colors.EditColor
        });
        selector.setItems(_getCreationList(this.objectDef));

        var addButton = MenuBar.makeMenuButton("+");
        addButton.on('click',function(){
            _addObject.call(this,selector.getSelectedItem());
        }.bind(this));

        this._hideObjectFunction = function()
        {
            menu.removeChild(selector);
            menu.removeChild(addButton);
        };

        menu.addChild(addButton);
        menu.addChild(selector);
    };


    ObjectCreationModule.prototype.hide = function()
    {
        if (this._hideObjectFunction)
            this._hideObjectFunction();

    };

    function _addObject(objectName)
    {
        var model = gapi.drive.realtime.custom.getModel(this.objectDef);
        var objDef = DynamicObject.create(model,this.modelLoader.nextObjectId(objectName),'constructed');
        objDef.properties.set("constructorName",objectName);

        this.modelLoader.addObject(objDef.id,objDef);

        this.objectDef.relationships.push(model.createString(objDef.id));
    }


    module.exports = ObjectCreationModule;
});