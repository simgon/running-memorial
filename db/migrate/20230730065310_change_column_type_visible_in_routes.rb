class ChangeColumnTypeVisibleInRoutes < ActiveRecord::Migration[7.0]
  def change
    change_column :routes, :visible, :string, default: "1"
  end
end
