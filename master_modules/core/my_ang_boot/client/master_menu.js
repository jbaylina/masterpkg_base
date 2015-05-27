/*jslint node: true */
/*global angular */
/*global document */

(function () {
    "use strict";

    var mod = angular.module('master_menu',['principal', 'gettext']);
    mod.provider('masterMenu', function masterMenuProvider() {
        var menuItems = [];
        return {
            define: function(menuItem) {
                menuItems.push(menuItem);
            },
            $get: ["_", "principal","gettextCatalog", function(_, principal, gettextCatalog) {

                function MainMenu() {

                    this.define = function(menuItem) {
                        menuItems.push(menuItem);
                    };

                    this.translateSubmenus = function (node) {
                        var self = this;
                        if (node.name) {
                            node.name = gettextCatalog.getString(node.name);
                        }
                        _.each(node.subMenu, function(node) {
                            self.translateSubmenus(node);
                        });
                    };

                    this.getDefaultMenu = function() {

                        function minLevel(node) {
                            var min;
                            if (typeof node.minLevel === "undefined") {
                                if (node.subMenu) {
                                    min = 0;
                                } else {
                                    min = Number.MAX_VALUE;
                                }
                            } else {
                                min = node.minLevel;
                            }
                            _.each(node.subMenu, function(subNode) {
                                var v = minLevel(subNode) - 1;
                                if (v>min) min=v;
                            });
                            return min;
                        }

                        function removeSingleSubmenus(node, level) {
                            level = level || 0;
                            _.each(node.subMenu, function(subNode, idx) {
                                removeSingleSubmenus(subNode, level+1);
                                if ((subNode.subMenu) &&
                                    (subNode.subMenu.length === 1) &&
                                    (minLevel(subNode.subMenu[0]) <= level + 1)) {
                                    node.subMenu[idx] = subNode.subMenu[0];
                                }
                            });
                        }

                        function convertObjectToArray(node) {
                            _.each(node.subMenu, convertObjectToArray);
                            if (node.subMenu) {
                                node.subMenu = _.toArray(node.subMenu);
                                node.subMenu.sort(function(a,b) {
                                    var va = a.order || Number.MAX_VALUE;
                                    var vb = b.order || Number.MAX_VALUE;
                                    return va - vb;
                                });
                            }
                        }

                        var tree = {subMenu: {}};
                        _.each(menuItems, function(menuItem) {
                            if ((!menuItem[menuItem.length-1].rights) ||
                                principal.isInAnyRight(menuItem[menuItem.length-1].rights))
                            {
                                var parent=tree;
                                _.each(menuItem, function(node) {
                                    if (!parent.subMenu) parent.subMenu={};
                                    if (!parent.subMenu[node.name]) {
                                        parent.subMenu[node.name] = _.clone(node);
                                    }
                                    parent = parent.subMenu[node.name];
                                });
                            }
                        });

                        convertObjectToArray(tree);
                        removeSingleSubmenus(tree);

                        return tree.subMenu;
                    };

                    this.getMenu = function() {
                        var menu = principal.getMenu();
                        if (!menu) {
                            menu = this.getDefaultMenu();
                        }
                        this.translateSubmenus({ subMenu: menu});
                        return menu;
                    };
                }

                return new MainMenu(menuItems);
            }]
        };
    });
})();
