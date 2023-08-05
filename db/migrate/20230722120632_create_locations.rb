class CreateLocations < ActiveRecord::Migration[7.0]
  def change
    create_table :locations do |t|
      t.decimal :lat_loc
      t.decimal :lon_loc
      t.integer :loc_order
      t.references :route, null: false, foreign_key: true

      t.timestamps
    end
  end
end
