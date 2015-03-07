define(function(require,exports,module){

    var MenuBar = require('Views/MenuBar');

    function EditManager(mainView)
    {
        this.mainView = mainView;
        this.controllers = {};
    }

    EditManager.prototype.registerController = function(controller)
    {
        if (this.controllers.indexOf(controller) < 0)
            this.controllers.push(controller);
        else
        {
            console.error("Controller already registered");
            return;
        }

        if (this.isEnabled)
        {
            setControllerEditMode.call(this,controller,"Local");
        }
    };

    EditManager.prototype.setGlobalController = function(globalController)
    {
        if (this.controllers.indexOf(globalController) < 0)
        {
            throw "Global controller must be a registered controller";
        }

        if (this.globalController == globalController)
        {
            throw "This object is already the global controller";
        }

        this.globalController = globalController;
        if (this.isEnabled)
        {
            setControllerEditMode.call(this,this.globalController,"Global");
        }
    };

    function _getGlobalMenu()
    {
        if (!this.globalMenu)
        {
            var menu = new MenuBar();
            this.mainView.add(menu.getModifier()).add(menu.getRenderController());
            this.globalMenu = menu;
        }
        this.globalMenu.show();
        return this.globalMenu;
    }

    function setActiveController(controller, editContext)
    {
        if (this.activeController)
        {
            this.activeController.destroyEditors();
        }

        controller.destroyEditTrigger();
        controller.createEditors(editContext);

        setControllerEditMode.call(this,this.activeController,"Local");

        this.activeController = controller;
    }

    function setControllerEditMode(controller,editMode)
    {
        switch (editMode)
        {
            case "Local":
                var editContext = {};
                editContext.trigger = controller.createEditTrigger();
                editContext.trigger.on('click', function(){
                    setActiveController.call(this,controller,editContext);
                }.bind(this));
                break;
            case "ReadOnly":
                controller.destroyEditors();
                controller.destroyEditTrigger();
                break;
            case "Global":
                editContext = {
                    "isGlobal":true,
                    "globalMenu":_getGlobalMenu.call(this)
                };
                controller.createEditors(editContext);
                break;
        }
    }

    EditManager.prototype.enable = function()
    {
        this.isEnabled = true;
        for (var i=0;i<this.controllers.length;i++)
        {
            setControllerEditMode(this.controllers[i],"Local");
        }

        if (this.globalController)
        {
            setControllerEditMode(this.globalController,"Global");
        }
    };

    EditManager.prototype.disable = function()
    {
        this.isEnabled = false;
        for (var i=0;i<this.controllers.length;i++)
        {
            setControllerEditMode.call(this.controllers[i],"ReadOnly");
        }

        if (this.globalMenu)
            this.globalMenu.hide();
    };

    module.exports = EditManager;

});