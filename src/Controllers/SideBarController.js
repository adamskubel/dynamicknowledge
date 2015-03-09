define(function(require,exports,module)
{
    var DynamicContainerController = require('Controllers/DynamicContainerController');
    var BoxView = require('PositioningLayouts/BoxView');
    var ObjectCreationModule = require('Editors/ObjectCreationModule');
    var AbstractObjectController = require('Controllers/AbstractObjectController');

    var MenuBar = require('Views/MenuBar');
    var Colors = require('Colors');

    function SideBarController(objectDef)
    {
        DynamicContainerController.call(this, objectDef,DynamicKnowledge.ModelLoader);
    }

    SideBarController.prototype = Object.create(DynamicContainerController.prototype);
    SideBarController.prototype.constructor = SideBarController;
    module.exports = SideBarController;

    SideBarController.prototype.makeContainerView = function()
    {
        return DynamicKnowledge.MainView.textLayout;
    };

    SideBarController.prototype.makeEditor = function(editorName)
    {
        switch (editorName)
        {
            case "add":
                return new ObjectCreationModule(this, this.objectDef, ["SideBarLabel"]);
            default:
                return DynamicContainerController.prototype.makeEditor.call(this,editorName);
        }
    };

    SideBarController.prototype.createEditRules = function(editContext)
    {
        var editors = [];

        editors.push("add");

        return editors;
    };

    SideBarController.prototype.addController = function(controller)
    {
        AbstractObjectController.prototype.addController.call(this,controller);

        var view = controller.getView();
        if (view.parent != this.containerView)
        {
            view.setSize([this.containerView.size[0],true]);
            this.containerView.addChild(view);
        }
    };

    SideBarController.prototype.makeMenuBar = function()
    {
        var menuBar = new MenuBar({
            viewOrigin:[0,0]
        });

        this.containerView.addChild(menuBar);

        menuBar.hide = function(){
            this.containerView.removeChild(menuBar);
        }.bind(this);

        return menuBar;
    };



});