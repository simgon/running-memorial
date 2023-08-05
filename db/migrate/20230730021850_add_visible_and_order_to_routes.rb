class AddVisibleAndOrderToRoutes < ActiveRecord::Migration[7.0]
  def change
    add_column :routes, :visible, :boolean, default: true
    add_column :routes, :order, :integer
  end
end
