class Route < ApplicationRecord
  belongs_to :user
  has_many :locations, dependent: :destroy

  validates :name, length: { maximum: 50 }
end
